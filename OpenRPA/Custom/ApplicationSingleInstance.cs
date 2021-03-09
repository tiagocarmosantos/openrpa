using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows;
using OpenRPA.Interfaces;

namespace OpenRPA.Custom
{
    public sealed class ApplicationSingleInstance
    {
        private const int SwRestore = 9;
        private static long _restarted;
        public static bool Restarted => Interlocked.Read( ref _restarted ) == 1;

        [DllImport("User32.dll")]
        private static extern bool IsIconic(IntPtr hWnd);

        [DllImport("User32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("User32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        public static bool AlreadyRunning()
        {
            var running = false;
            try
            {
                var currentProcess = Process.GetCurrentProcess();

                foreach (var p in Process.GetProcesses())
                {
                    if (p.Id == currentProcess.Id) continue;
                    if (p.ProcessName.Equals(currentProcess.ProcessName) != true) continue;

                    running = true;

                    var handle = p.MainWindowHandle;

                    if (IsIconic(handle)) ShowWindow(handle, SwRestore);

                    SetForegroundWindow(handle);

                    break;
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, nameof(ApplicationSingleInstance));
            }

            return running;
        }

        public static void Restart()
        {
            if (0 != Interlocked.Exchange(ref _restarted, 1)) return;
            Process.Start(Application.ResourceAssembly.Location, "AUTORESTART");
            Application.Current?.Shutdown();
        }
    }
}