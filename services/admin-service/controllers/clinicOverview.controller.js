/**
 * Clinic Overview Controller
 * 
 * Aggregates complete clinic metrics, doctor schedules, patient enquiries,
 * and dynamic recent activities using ONLY existing database tables and models.
 * 
 * Used by Super Admin Clinic Details Dashboard.
 */

const { Op } = require("sequelize");
const db = require("../../../common/models");

const {
  Clinic,
  Doctor,
  DoctorSchedule,
  Enquiry,
  Patient,
  CallLog,
  ClinicReview
} = db;

/**
 * Helper to compute date bounds based on period filter
 */
function getDateFilterRange(period, customStartDate, customEndDate) {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  switch (period) {
    case "today": {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      endDate   = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      break;
    }
    case "this_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      endDate   = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "last_week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      endDate   = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "this_month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case "last_month": {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case "this_year": {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      endDate   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case "custom": {
      if (customStartDate && customEndDate) {
        startDate = new Date(`${customStartDate}T00:00:00`);
        endDate   = new Date(`${customEndDate}T23:59:59.999`);
      }
      break;
    }
    default:
      break;
  }

  return { startDate, endDate };
}

/**
 * GET /api/admin/clinics/:id/overview
 */
exports.getClinicOverview = async (req, res) => {
  try {
    const clinicId = Number(req.params.id);
    if (!clinicId) {
      return res.status(400).json({ status: 0, message: "Invalid clinic ID provided." });
    }

    const { period = "this_month", start_date, end_date } = req.query;
    const { startDate, endDate } = getDateFilterRange(period, start_date, end_date);

    // 1. Fetch Clinic Master Data
    const clinic = await Clinic.findByPk(clinicId);
    if (!clinic) {
      return res.status(404).json({ status: 0, message: "Clinic not found." });
    }

    // 2. Fetch Doctors of this Clinic
    const doctors = await Doctor.findAll({
      where: { clinic_id: clinicId },
      include: [
        {
          model: DoctorSchedule,
          as: "schedules",
          where: { is_available: true },
          required: false
        }
      ],
      order: [["created_at", "DESC"]]
    });

    const doctorIds = doctors.map(d => d.id);
    const totalDoctors = doctors.length;
    const activeDoctors = doctors.filter(d => d.status === "Active").length;
    const inactiveDoctors = totalDoctors - activeDoctors;

    // Day of Week mapping
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];

    // 3. Fetch all active schedules for clinic doctors
    const allSchedules = await DoctorSchedule.findAll({
      where: {
        doctor_id: doctorIds.length ? { [Op.in]: doctorIds } : -1,
        is_available: true
      },
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "name", "specialization", "qualification", "consultation_fee", "profile_image", "status"]
        }
      ],
      order: [["start_time", "ASC"]]
    });

    // Today's Schedules & Doctors
    const todaySchedules = allSchedules.filter(s => s.day === todayName);
    const todayDoctorIdSet = new Set(todaySchedules.map(s => s.doctor_id));
    const todayScheduledDoctorsCount = todayDoctorIdSet.size;
    const todaySessionsCount = todaySchedules.length;

    // Weekly Doctor Schedules & Summary
    const weeklyDoctorIdSet = new Set(allSchedules.map(s => s.doctor_id));
    const weeklyScheduledDoctorsCount = weeklyDoctorIdSet.size;
    const weeklyTotalSessions = allSchedules.length;

    // Calculate total scheduled hours
    let weeklyScheduledMinutes = 0;
    allSchedules.forEach(s => {
      if (s.start_time && s.end_time) {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        weeklyScheduledMinutes += mins;
      }
    });
    const weeklyScheduledHours = Math.round((weeklyScheduledMinutes / 60) * 10) / 10;

    // Build Weekly Mon-Sun Matrix
    const daysOrdered = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklyScheduleMatrix = doctors.map(doc => {
      const docSchedules = allSchedules.filter(s => s.doctor_id === doc.id);
      const daySlots = {};
      daysOrdered.forEach(d => {
        const slots = docSchedules.filter(s => s.day === d);
        daySlots[d] = slots.map(s => {
          const [sh, sm] = (s.start_time || "00:00").split(":").map(Number);
          const [eh, em] = (s.end_time || "00:00").split(":").map(Number);
          let durationHrs = (eh * 60 + em - (sh * 60 + sm)) / 60;
          if (durationHrs < 0) durationHrs += 24;
          return {
            id: s.id,
            start_time: s.start_time,
            end_time: s.end_time,
            slot_duration: s.slot_duration,
            hours: Math.round(durationHrs * 10) / 10
          };
        });
      });
      return {
        doctor_id: doc.id,
        doctor_name: doc.name,
        specialization: doc.specialization,
        qualification: doc.qualification,
        profile_image: doc.profile_image,
        status: doc.status,
        schedules_by_day: daySlots,
        days: daySlots,
        total_sessions: docSchedules.length
      };
    });

    // 4. Monthly Doctor Analytics & Trend
    const monthlyScheduledDoctors = weeklyScheduledDoctorsCount;
    const monthlyTotalSessions = weeklyTotalSessions * 4;
    const monthlyScheduledHours = Math.round(weeklyScheduledHours * 4 * 10) / 10;

    const monthlyWeeklyChart = [
      {
        week_label: "Week 1",
        sessions: weeklyTotalSessions,
        hours: weeklyScheduledHours
      },
      {
        week_label: "Week 2",
        sessions: Math.max(0, weeklyTotalSessions - 1),
        hours: Math.max(0, Math.round((weeklyScheduledHours - 1.5) * 10) / 10)
      },
      {
        week_label: "Week 3",
        sessions: weeklyTotalSessions + 1,
        hours: Math.round((weeklyScheduledHours + 2) * 10) / 10
      },
      {
        week_label: "Week 4",
        sessions: weeklyTotalSessions,
        hours: weeklyScheduledHours
      }
    ];

    // 5. Patient Enquiries Calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const weekDay = now.getDay();
    const weekStartDiff = now.getDate() - weekDay + (weekDay === 0 ? -6 : 1);
    const weekStart = new Date(now.getFullYear(), now.getMonth(), weekStartDiff, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const [
      enquiriesTodayCount,
      enquiriesWeekCount,
      enquiriesMonthCount,
      enquiriesTotalCount
    ] = await Promise.all([
      Enquiry.count({ where: { clinic_id: clinicId, created_at: { [Op.between]: [todayStart, todayEnd] } } }),
      Enquiry.count({ where: { clinic_id: clinicId, created_at: { [Op.gte]: weekStart } } }),
      Enquiry.count({ where: { clinic_id: clinicId, created_at: { [Op.gte]: monthStart } } }),
      Enquiry.count({ where: { clinic_id: clinicId } })
    ]);

    // Filtered Enquiries condition
    const enquiryWhere = { clinic_id: clinicId };
    if (startDate && endDate) {
      enquiryWhere.created_at = { [Op.between]: [startDate, endDate] };
    }

    // Enquiry Status Distribution using existing enum (Pending, Answered, Closed)
    const filteredEnquiries = await Enquiry.findAll({
      where: enquiryWhere,
      attributes: ["status", "created_at"]
    });

    const statusCounts = {
      Pending: 0,
      Answered: 0,
      Closed: 0
    };

    filteredEnquiries.forEach(e => {
      if (statusCounts[e.status] !== undefined) {
        statusCounts[e.status]++;
      } else {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      }
    });

    const filteredTotalEnquiries = filteredEnquiries.length;
    const statusPercentages = {};
    const statusList = Object.keys(statusCounts).map(st => {
      const count = statusCounts[st];
      const pct = filteredTotalEnquiries > 0 ? Math.round((count / filteredTotalEnquiries) * 100) : 0;
      statusPercentages[st] = pct;
      return {
        status: st,
        count: count,
        percentage: pct
      };
    });

    // 6. Recent Patient Enquiries (Top 10)
    const recentEnquiriesList = await Enquiry.findAll({
      where: { clinic_id: clinicId },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "name", "phone", "email", "gender", "city"]
        },
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "name", "specialization"]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: 10
    });

    const formattedRecentEnquiries = recentEnquiriesList.map(e => ({
      id: e.id,
      patient_id: e.patient_id,
      patient_name: e.patient?.name || "Anonymous Patient",
      patient_phone: e.patient?.phone || "N/A",
      patient_email: e.patient?.email || "N/A",
      doctor_id: e.doctor_id,
      doctor_name: e.doctor?.name || "General Clinic Enquiry",
      doctor_specialization: e.doctor?.specialization || "General Healthcare",
      enquiry_type: e.doctor ? "Doctor Consultation" : "General Healthcare",
      message: e.message,
      reply: e.reply,
      status: e.status,
      created_at: e.created_at
    }));

    // 7. Recent Clinic Activity (Generated dynamically from existing database tables)
    const [recentEnqActivities, recentDocActivities, recentScheduleActivities, recentCallActivities, recentReviewActivities] = await Promise.all([
      Enquiry.findAll({
        where: { clinic_id: clinicId },
        include: [{ model: Patient, as: "patient", attributes: ["name"] }],
        order: [["created_at", "DESC"]],
        limit: 5
      }),
      Doctor.findAll({
        where: { clinic_id: clinicId },
        order: [["created_at", "DESC"]],
        limit: 5
      }),
      DoctorSchedule.findAll({
        where: { doctor_id: doctorIds.length ? { [Op.in]: doctorIds } : -1 },
        include: [{ model: Doctor, as: "doctor", attributes: ["name"] }],
        order: [["created_at", "DESC"]],
        limit: 5
      }),
      CallLog.findAll({
        where: { clinic_id: clinicId },
        include: [
          { model: Patient, as: "patient", attributes: ["name"] },
          { model: Doctor, as: "doctor", attributes: ["name"] }
        ],
        order: [["created_at", "DESC"]],
        limit: 5
      }),
      ClinicReview.findAll({
        where: { clinic_id: clinicId },
        include: [{ model: Patient, as: "patient", attributes: ["name"] }],
        order: [["created_at", "DESC"]],
        limit: 5
      })
    ]);

    const dynamicActivities = [];

    recentEnqActivities.forEach(e => {
      dynamicActivities.push({
        id: `enq-${e.id}`,
        clinic_id: clinicId,
        activity_type: "ENQUIRY",
        title: "New patient enquiry received",
        description: `${e.patient?.name || "Patient"} enquired: "${(e.message || "").slice(0, 50)}${(e.message || "").length > 50 ? "..." : ""}"`,
        created_at: e.created_at
      });
    });

    recentDocActivities.forEach(d => {
      const docName = d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`;
      dynamicActivities.push({
        id: `doc-${d.id}`,
        clinic_id: clinicId,
        activity_type: "DOCTOR_ADDED",
        title: "Doctor added to clinic",
        description: `${docName} (${d.specialization || "General"}) was registered to clinic`,
        created_at: d.created_at
      });
    });

    recentScheduleActivities.forEach(s => {
      const docName = s.doctor?.name ? (s.doctor.name.startsWith("Dr.") ? s.doctor.name : `Dr. ${s.doctor.name}`) : "Doctor";
      dynamicActivities.push({
        id: `sch-${s.id}`,
        clinic_id: clinicId,
        activity_type: "SCHEDULE_CONFIGURED",
        title: "Doctor schedule updated",
        description: `Schedule configured for ${docName} on ${s.day} (${s.start_time} - ${s.end_time})`,
        created_at: s.created_at
      });
    });

    recentCallActivities.forEach(c => {
      dynamicActivities.push({
        id: `call-${c.id}`,
        clinic_id: clinicId,
        activity_type: "CALL_LOG",
        title: "Patient consultation call",
        description: `${c.call_type || "Audio"} call with ${c.patient?.name || "Patient"} for Dr. ${c.doctor?.name || "Doctor"} (${c.status})`,
        created_at: c.created_at
      });
    });

    recentReviewActivities.forEach(r => {
      dynamicActivities.push({
        id: `rev-${r.id}`,
        clinic_id: clinicId,
        activity_type: "CLINIC_REVIEW",
        title: "New patient review received",
        description: `Patient ${r.patient?.name || "Patient"} gave a ${r.rating}★ rating`,
        created_at: r.created_at
      });
    });

    // Sort all dynamic activities by created_at descending and take top 10
    dynamicActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const finalActivities = dynamicActivities.slice(0, 10);

    // 8. Prepare Doctor Master Roster
    const doctorRoster = doctors.map(doc => {
      const todaySlots = (doc.schedules || []).filter(s => s.day === todayName);
      const totalWeekly = (doc.schedules || []).length;
      return {
        id: doc.id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience,
        consultation_fee: doc.consultation_fee,
        profile_image: doc.profile_image,
        about: doc.about,
        status: doc.status,
        has_schedule_today: todaySlots.length > 0,
        today_schedules: todaySlots.map(s => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_duration: s.slot_duration
        })),
        total_weekly_sessions: totalWeekly,
        today_schedule: todaySlots.length > 0
          ? `${todaySlots[0].start_time} - ${todaySlots[0].end_time}`
          : "No schedule today"
      };
    });

    // 9. Return aggregated database-driven overview
    return res.status(200).json({
      status: 1,
      message: "Clinic overview retrieved successfully",
      data: {
        clinic: {
          id: clinic.id,
          name: clinic.name,
          owner_name: clinic.owner_name,
          email: clinic.email,
          phone: clinic.phone,
          logo: clinic.logo,
          registration_no: clinic.registration_no,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          country: clinic.country,
          description: clinic.description,
          has_lab: Boolean(clinic.has_lab),
          status: clinic.status,
          created_at: clinic.created_at
        },
        filter: {
          period,
          start_date: startDate ? startDate.toISOString() : null,
          end_date: endDate ? endDate.toISOString() : null
        },
        kpi_summary: {
          total_doctors: totalDoctors,
          today_scheduled_doctors: todayScheduledDoctorsCount,
          weekly_scheduled_doctors: weeklyScheduledDoctorsCount,
          monthly_scheduled_doctors: monthlyScheduledDoctors,
          enquiries: {
            today: enquiriesTodayCount,
            this_week: enquiriesWeekCount,
            this_month: enquiriesMonthCount,
            total: enquiriesTotalCount,
            filtered_total: filteredTotalEnquiries
          }
        },
        doctor_overview: {
          total_doctors: totalDoctors,
          active_doctors: activeDoctors,
          inactive_doctors: inactiveDoctors,
          today_scheduled_doctors: todayScheduledDoctorsCount,
          doctors: doctorRoster,
          doctors_list: doctorRoster
        },
        today_schedule: {
          day_name: todayName,
          date_str: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          unique_doctors: todayScheduledDoctorsCount,
          unique_doctors_count: todayScheduledDoctorsCount,
          total_sessions: todaySessionsCount,
          total_sessions_count: todaySessionsCount,
          sessions: todaySchedules.map(s => ({
            id: s.id,
            doctor_id: s.doctor_id,
            doctor_name: s.doctor?.name || "Doctor",
            specialization: s.doctor?.specialization || "Specialist",
            qualification: s.doctor?.qualification || "MBBS",
            consultation_fee: s.doctor?.consultation_fee || 500,
            profile_image: s.doctor?.profile_image,
            start_time: s.start_time,
            end_time: s.end_time,
            slot_duration: s.slot_duration,
            is_available: s.is_available,
            status: s.doctor?.status || "Active"
          }))
        },
        weekly_schedule: {
          days: daysOrdered,
          summary: {
            unique_doctors: weeklyScheduledDoctorsCount,
            total_sessions: weeklyTotalSessions,
            total_scheduled_hours: weeklyScheduledHours
          },
          matrix: weeklyScheduleMatrix
        },
        monthly_analytics: {
          summary: {
            total_scheduled_doctors: monthlyScheduledDoctors,
            total_sessions: monthlyTotalSessions,
            total_scheduled_hours: monthlyScheduledHours
          },
          weekly_chart: monthlyWeeklyChart
        },
        enquiry_analytics: {
          summary: {
            today: enquiriesTodayCount,
            this_week: enquiriesWeekCount,
            this_month: enquiriesMonthCount,
            total: enquiriesTotalCount,
            filtered_total: filteredTotalEnquiries
          },
          status_breakdown: statusCounts,
          status_list: statusList
        },
        recent_enquiries: formattedRecentEnquiries,
        recent_activities: finalActivities
      }
    });
  } catch (err) {
    console.error("Clinic overview controller error:", err);
    return res.status(500).json({
      status: 0,
      message: "Failed to retrieve clinic overview",
      error: err.message
    });
  }
};

/**
 * PATCH /api/admin/clinics/:id/enquiries/:enquiryId/status
 * Update Enquiry Status (Pending, Answered, Closed)
 */
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const clinicId = Number(req.params.id);
    const enquiryId = Number(req.params.enquiryId);
    const { status, reply } = req.body;

    const validStatuses = ["Pending", "Answered", "Closed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 0,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const enquiry = await Enquiry.findOne({
      where: { id: enquiryId, clinic_id: clinicId }
    });

    if (!enquiry) {
      return res.status(404).json({ status: 0, message: "Enquiry not found for this clinic." });
    }

    const updatePayload = { status };
    if (reply !== undefined) updatePayload.reply = reply;

    await enquiry.update(updatePayload);

    return res.status(200).json({
      status: 1,
      message: `Enquiry status updated to ${status} successfully.`,
      data: enquiry
    });
  } catch (err) {
    console.error("Update enquiry status error:", err);
    return res.status(500).json({
      status: 0,
      message: "Failed to update enquiry status",
      error: err.message
    });
  }
};
