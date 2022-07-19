using Newtonsoft.Json.Linq;
using System;
using System.Runtime.Serialization;

namespace OpenRPA.Interfaces
{
    [Serializable]
    [DataContract]
    public class NativeMessagingMessageWindow
    {
        public NativeMessagingMessageWindow(NativeMessagingMessage msg)
        {
            browser = msg.browser;
            id = msg.windowId;
            try
            {
                if (msg.result == null || string.IsNullOrEmpty(msg.result.ToString()))
                {
                    Log.Warning(
                        "parsing NMElement that is not an html element (functionName: "
                            + msg.functionName
                            + ")"
                    );
                    return;
                }
                var obj = JObject.Parse(msg.result.ToString());
                if (obj.ContainsKey("alwaysOnTop"))
                    alwaysOnTop = obj.Value<bool>("alwaysOnTop");
                if (obj.ContainsKey("focused"))
                    focused = obj.Value<bool>("focused");
                if (obj.ContainsKey("heigh"))
                    heigh = obj.Value<int>("heigh");
                if (obj.ContainsKey("incognito"))
                    incognito = obj.Value<bool>("incognito");
                if (obj.ContainsKey("left"))
                    left = obj.Value<int>("left");
                if (obj.ContainsKey("state"))
                    state = obj.Value<string>("state");
                if (obj.ContainsKey("top"))
                    top = obj.Value<int>("top");
                if (obj.ContainsKey("type"))
                    type = obj.Value<string>("type");
                if (obj.ContainsKey("width"))
                    width = obj.Value<int>("width");
            }
            catch (Exception ex)
            {
                Log.Error(ex.ToString());
            }
        }

        [DataMember(Name = "browser")]
        public string browser { get; set; }

        [DataMember(Name = "id")]
        public int id { get; set; }

        [DataMember(Name = "alwaysOnTop")]
        public bool alwaysOnTop { get; set; }

        [DataMember(Name = "focused")]
        public bool focused { get; set; }

        [DataMember(Name = "heigh")]
        public int heigh { get; set; }

        [DataMember(Name = "incognito")]
        public bool incognito { get; set; }

        [DataMember(Name = "left")]
        public int left { get; set; }

        [DataMember(Name = "state")]
        public string state { get; set; }

        [DataMember(Name = "top")]
        public int top { get; set; }

        [DataMember(Name = "type")]
        public string type { get; set; }

        [DataMember(Name = "width")]
        public int width { get; set; }
    }
}
