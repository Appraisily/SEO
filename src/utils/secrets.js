const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function getSecret(name) {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${process.env.PROJECT_ID}/secrets/${name}/versions/latest`,
  });
  return version.payload.data.toString();
}

module.exports = {
  getSecret
};