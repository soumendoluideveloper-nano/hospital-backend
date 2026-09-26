module.exports = {
  apps: [
    {
      name: "carespot-api-gateway",
      script: "server.js",
      env: {
        NODE_ENV: "demo"
      }
    },
    {
      name: "carespot-auth-service",
      script: "services/auth-service/server.js",
      env: {
        NODE_ENV: "demo"
      }
    },
    {
      name: "carespot-clinic-service",
      script: "services/clinic-service/server.js",
      env: {
        NODE_ENV: "demo"
      }
    },
    {
      name: "carespot-patient-service",
      script: "services/patient-service/server.js",
      env: {
        NODE_ENV: "demo"
      }
    },
    {
      name: "carespot-lab-service",
      script: "services/lab-service/server.js",
      env: {
        NODE_ENV: "demo"
      }
    },
    {
      name: "carespot-admin-service",
      script: "services/admin-service/server.js",
      env: {
        NODE_ENV: "demo"
      }
    }
  ]
};
