import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // REMOVED: "&channel_binding=require"
    url: "postgresql://neondb_owner:npg_GP7zk5EhKQML@ep-floral-feather-a1xprotg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  },
});