using System;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using OpenRPA.Interfaces;

namespace OpenRPA.Custom
{
    public class ChromiumExtensionUtils
    {
        private const string ChromePreferencesFile = @"%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Preferences";

        private const string EdgePreferencesFile = @"%USERPROFILE%\AppData\Local\Microsoft\Edge\User Data\Default\Preferences";

        private const string ChromeExtensionsFolder = @"%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\Extensions";

        private const string EdgeExtensionsFolder = @"%USERPROFILE%\AppData\Local\Microsoft\Edge\User Data\Default\Extensions";

        private static ExtensionSearchResult FindExtensionsFolderStrategy(string extensionId, string pathBase)
        {
            var path = Path.Combine(Environment.ExpandEnvironmentVariables(pathBase), extensionId);

            var pluginDirectory = new DirectoryInfo(path);

            if (pluginDirectory.Exists && pluginDirectory.EnumerateDirectories().Any())
                return new ExtensionSearchResult(true, true);

            return ExtensionSearchResult.None;
        }

        public static void CheckChromeExtensionExistence(string extensionId, ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            var result = FindExtensionsFolderStrategy(extensionId, ChromeExtensionsFolder);

            if (result.Found)
            {
                pluginIsPresent = result.PluginIsPresent;
                pluginIsActive = result.PluginIsActive;
                return;
            }

            CheckChromiumExtensionExistence(ChromePreferencesFile, extensionId, ref pluginIsPresent, ref pluginIsActive);
        }

        public static void CheckEdgeExtensionExistence(string extensionId, ref bool pluginIsPresent,
            ref bool pluginIsActive)
        {
            var result = FindExtensionsFolderStrategy(extensionId, EdgeExtensionsFolder);

            if (result.Found)
            {
                pluginIsPresent = result.PluginIsPresent;
                pluginIsActive = result.PluginIsActive;
                return;
            }

            CheckChromiumExtensionExistence(EdgePreferencesFile, extensionId, ref pluginIsPresent, ref pluginIsActive);
        }

        private static void CheckChromiumExtensionExistence(string pathWithEnv, string extensionId,
            ref bool pluginIsPresent, ref bool pluginIsActive)
        {
            var path = Environment.ExpandEnvironmentVariables(pathWithEnv);

            if (!File.Exists(path))
            {
                pluginIsPresent = pluginIsActive = false;
                return;
            }

            var preferencesJObject = JObject.Parse(File.ReadAllText(path));

            var extensionsProps = preferencesJObject.Property("extensions");

            if (extensionsProps != null)
            {
                var settingsProps = ((JObject)extensionsProps.Value).Property("settings");

                JProperty pluginExtension = null;
                try
                {
                    if (settingsProps != null) pluginExtension = ((JObject)settingsProps.Value).Property(extensionId);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }

                if (pluginExtension != null)
                {
                    pluginIsPresent = true;
                    var disableReasonsProps = ((JObject)pluginExtension.Value).Property("disable_reasons");
                    pluginIsActive = disableReasonsProps == null;
                }
                else
                {
                    pluginIsPresent = false;
                    pluginIsActive = false;
                }
            }

            Log.Information(
                $"{nameof(CheckChromiumExtensionExistence)}:{pathWithEnv} extensionId:{extensionId} pluginIsPresent:{pluginIsPresent} pluginIsActive:{pluginIsActive}");
        }

        private readonly struct ExtensionSearchResult
        {
            public static readonly ExtensionSearchResult None = new ExtensionSearchResult(false, false);
            public bool PluginIsPresent { get; }
            public bool PluginIsActive { get; }

            public bool Found => PluginIsActive && PluginIsPresent;

            public ExtensionSearchResult(bool pluginIsPresent, bool pluginIsActive)
            {
                PluginIsPresent = pluginIsPresent;
                PluginIsActive = pluginIsActive;
            }
        }
    }


}