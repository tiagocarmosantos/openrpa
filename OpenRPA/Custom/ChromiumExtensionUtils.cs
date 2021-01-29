using System;
using System.IO;
using Newtonsoft.Json.Linq;
using OpenRPA.Interfaces;

namespace OpenRPA.Custom
{
    public class ChromiumExtensionUtils
    {
        public static void CheckChromeExtensionExistance(string extensionId, ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            string pathWithEnv = @"%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Preferences";
            checkChromiumExtensionExistance(pathWithEnv, extensionId, ref pluginIsPresent, ref pluginIsActive);
        }

        public static void CheckChromeExtensionExistance(string pathWithEnv, string extensionId, ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            checkChromiumExtensionExistance(pathWithEnv, extensionId, ref pluginIsPresent, ref pluginIsActive);
        }

        public static void CheckEdgeExtensionExistance(string extensionId, ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            string pathWithEnv = @"%USERPROFILE%\AppData\Local\Microsoft\Edge\User Data\Default\Preferences";
            checkChromiumExtensionExistance(pathWithEnv, extensionId, ref pluginIsPresent, ref pluginIsActive);
        }

        private static void checkChromiumExtensionExistance(string pathWithEnv, string extensionId, ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            var path = Environment.ExpandEnvironmentVariables(pathWithEnv);

            JObject preferencesJObject = JObject.Parse(File.ReadAllText(path));
            JProperty extensionsProps = preferencesJObject.Property("extensions");
            JProperty settingsProps = ((JObject)extensionsProps.Value).Property("settings");

            JProperty pluginExtension = null;
            try
            {
                pluginExtension = ((JObject)settingsProps.Value).Property(extensionId);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            if (pluginExtension != null)
            {
                pluginIsPresent = true;
                JProperty disableReasonsProps = ((JObject)pluginExtension.Value).Property("disable_reasons");
                if (disableReasonsProps != null)
                {
                    pluginIsActive = false;
                }
                else
                {
                    pluginIsActive = true;
                }
            }
            else
            {
                pluginIsPresent = false;
                pluginIsActive = false;
            }

            Log.Information($"checkChromiumExtensionExistance:{pathWithEnv} extensionId:{extensionId} pluginIsPresent:{pluginIsPresent} pluginIsActive:{pluginIsActive}");
        }
    }
}
