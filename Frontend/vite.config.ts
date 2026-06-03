import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          driverDashboard: path.resolve(__dirname, 'driver/dashboard.html'),
          driverTrips: path.resolve(__dirname, 'driver/trips.html'),
          driverEarnings: path.resolve(__dirname, 'driver/earnings.html'),
          driverProfile: path.resolve(__dirname, 'driver/profile.html'),
          adminDashboard: path.resolve(__dirname, 'admin/dashboard.html'),
          adminUsers: path.resolve(__dirname, 'admin/users.html'),
          adminDrivers: path.resolve(__dirname, 'admin/drivers.html'),
          adminTrips: path.resolve(__dirname, 'admin/trips.html'),
          adminReports: path.resolve(__dirname, 'admin/reports.html')
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
