using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace OpenRPA.Custom
{
    public class Helper
    {
        public static bool IsBrowserInstalled(Func<string, bool> predicate)
        {
            var keysWin32 = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Clients\StartMenuInternet")?.GetSubKeyNames() ??
                            new string[0];
            var keysWin64 =
                Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Wow6432Node\Clients\StartMenuInternet")?.GetSubKeyNames() ??
                new string[0];

            return keysWin32.Any(predicate) || keysWin64.Any(predicate);
        }

        public static bool IsChromeInstalled()
        {
            return IsBrowserInstalled(_ => -1 != _.IndexOf("Google Chrome", StringComparison.InvariantCultureIgnoreCase));
        }
        public static bool IsEdgeInstalled()
        {
            return IsBrowserInstalled(_ => -1 != _.IndexOf("Microsoft Edge", StringComparison.InvariantCultureIgnoreCase));
        }

        public static void IsOpenRPAExtnInstalledOnChrome(ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            try
            {
                ChromiumExtensionUtils.CheckChromeExtensionExistance(@"hpnihnhlcnfejboocnckgchjdofeaphe", ref pluginIsPresent, ref pluginIsActive);
            }
            catch (Exception e) //catch (FileNotFoundException fileNotFoundException)
            {
                pluginIsPresent = false;
                pluginIsActive = false;
            }

        }

        public static void IsMyInvenioExtnInstalledOnChrome(ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            try
            {
                ChromiumExtensionUtils.CheckChromeExtensionExistance(@"gmpnnjghibofefmnppkgkadiijlblhia", ref pluginIsPresent, ref pluginIsActive);
            }
            catch (Exception e) //catch (FileNotFoundException fileNotFoundException)
            {
                pluginIsPresent = false;
                pluginIsActive = false;
            }
        }

        public static void IsOpenRPAExtnInstalledOnEdge(ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            try
            {
                ChromiumExtensionUtils.CheckEdgeExtensionExistance(@"hpnihnhlcnfejboocnckgchjdofeaphe", ref pluginIsPresent, ref pluginIsActive);
            }
            catch (Exception e) //catch (FileNotFoundException fileNotFoundException)
            {
                pluginIsPresent = false;
                pluginIsActive = false;
            }
        }

        public static void IsMyInvenioExtnInstalledOnEdge(ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            try
            {
                ChromiumExtensionUtils.CheckEdgeExtensionExistance(@"gmpnnjghibofefmnppkgkadiijlblhia", ref pluginIsPresent, ref pluginIsActive);
            }
            catch (Exception e) //catch (FileNotFoundException fileNotFoundException)
            {
                pluginIsPresent = false;
                pluginIsActive = false;
            }
        }
    }
}
