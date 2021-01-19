using FlaUI.Core.AutomationElements;
using System.Collections.Generic;

namespace OpenRPA.Interfaces.Custom
{
    public static class PathRootDiscovery
    {
        public static IEnumerable<AutomationElement> GetPathToRoot(AutomationElement element)
        {
            var pathToRoot = new List<AutomationElement>();

            AutomationElement root = null;

            while (element != null)
            {
                try
                {
                    if (element.Parent != null) pathToRoot.Add(element);
                    if (element.Parent == null) root = element;
                }
                catch
                {
                    root = element;                    
                }

                try
                {
                    element = element.Parent;
                }
                catch
                {                    
                    break;
                }
            }

            if (root != null) pathToRoot.Add(root);

            pathToRoot.Reverse();

            return pathToRoot;
        }
    }
}
