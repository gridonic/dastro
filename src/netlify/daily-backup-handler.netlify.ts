import type { Handler } from '@netlify/functions';
import { buildClient } from '@datocms/cma-client-node';

export const dailyBackupHandler: Handler = async () => {
  const datoCmsCmaToken = process.env.DATO_CMS_CMA_TOKEN;
  const keepAtLeastDays = process.env.NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS
    ? parseInt(process.env.NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS)
    : 0;

  if (!datoCmsCmaToken) {
    console.error('Missing DATO_CMS_CMA_TOKEN environment variable');
    return {
      statusCode: 500,
      body: 'Missing DATO_CMS_CMA_TOKEN environment variable',
    };
  }

  if (keepAtLeastDays <= 0) {
    console.log(
      'NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS is set to 0, skipping backup',
    );
    return {
      statusCode: 200,
      body: 'NETLIFY_BACKUP_KEEP_AT_LEAST_DAYS is set to 0, skipping backup',
    };
  }

  const client = buildClient({
    apiToken: process.env.DATO_CMS_CMA_TOKEN as string,
  });

  const environments = await client.environments.list();

  const mainEnvironment = environments.find(
    (environment) => environment.meta.primary,
  );

  const previousBackups = environments.filter(
    (environment) =>
      environment.id.match('backup') && !environment.meta.primary,
  );

  console.log(`Found ${previousBackups.length} previous backups`);

  const dailyBackupId = `backup-${new Date().toISOString().split('T')[0]}`;

  const backupsToDelete = previousBackups.filter((backup) => {
    if (backup.id === dailyBackupId) {
      return true;
    }

    const backupDate = new Date(backup.id.split('-').slice(2).join('-'));
    return (
      backupDate < new Date(Date.now() - keepAtLeastDays * 24 * 60 * 60 * 1000)
    );
  });

  console.log(`Found ${backupsToDelete.length} backups to delete`);

  try {
    await Promise.all(
      backupsToDelete.map(async (backup) => {
        console.log(`Deleting backup ${backup.id}`);
        await client.environments.destroy(backup.id);
        console.log(`Deleted backup ${backup.id}`);
      }),
    );

    console.log(`Deleted ${backupsToDelete.length} backups`);
  } catch (error) {
    console.warn('Error deleting backups', error);
  }

  console.log(`Creating backup for environment ${mainEnvironment!.id}`);

  await client.environments.fork(
    mainEnvironment!.id,
    {
      id: dailyBackupId,
    },
    {
      fast: true,
      force: true,
    },
  );

  console.log(`Backup created for environment ${mainEnvironment!.id}`);

  return {
    statusCode: 200,
    body: `Backup created for environment ${mainEnvironment!.id}`,
  };
};
