using OpenRPA.NamedPipeWrapper;
using System;
using System.Runtime.Serialization;

namespace OpenRPA.Interfaces
{
    [Serializable]
    [DataContract]
    public class NativeMessagingMessage : PipeMessage
    {
        private NativeMessagingMessage() : base() { }

        public NativeMessagingMessage(string functionName, bool debug, string[] unique_xpath_ids)
            : base()
        {
            this.functionName = functionName;
            this.debug = debug;
            this.uniquexpathids = unique_xpath_ids;
        }

        public NativeMessagingMessage(NativeMessagingMessage e) : base(e)
        {
            functionName = e.functionName;
            browser = e.browser;
            windowId = e.windowId;
            tabid = e.tabid;
        }

        [DataMember(Name = "browser")]
        public string browser { get; set; }

        [DataMember(Name = "debug")]
        public bool debug { get; set; }

        [DataMember(Name = "uniquexpathids")]
        public string[] uniquexpathids { get; set; }

        [DataMember(Name = "windowId")]
        public int windowId { get; set; } = -1;

        [DataMember(Name = "functionName")]
        public string functionName { get; set; } = "ping";

        [DataMember(Name = "script")]
        public string script { get; set; }

        [DataMember(Name = "result")]
        public object result { get; set; }

        [DataMember(Name = "results")]
        public NativeMessagingMessage[] results { get; set; }

        [DataMember(Name = "tabid")]
        public int tabid { get; set; } = -1;

        [DataMember(Name = "frameId")]
        public long frameId { get; set; } = -1;

        [DataMember(Name = "zn_id")]
        public long zn_id { get; set; } = -1;

        [DataMember(Name = "key")]
        public string key { get; set; }

        [DataMember(Name = "frame")]
        public string frame { get; set; }

        [DataMember(Name = "tab")]
        public NativeMessagingMessageTab tab { get; set; }

        //public string selector { get; set; }
        [DataMember(Name = "cssPath")]
        public string cssPath { get; set; }

        [DataMember(Name = "xPath")]
        public string xPath { get; set; }

        [DataMember(Name = "xPathFull")]
        public string xPathFull { get; set; }

        [DataMember(Name = "xpaths")]
        public string[] xpaths { get; set; }

        [DataMember(Name = "fromcssPath")]
        public string fromcssPath { get; set; }

        [DataMember(Name = "fromxPath")]
        public string fromxPath { get; set; }

        [DataMember(Name = "x")]
        public int x { get; set; } = -1;

        [DataMember(Name = "y")]
        public int y { get; set; } = -1;

        [DataMember(Name = "width")]
        public int width { get; set; } = -1;

        [DataMember(Name = "height")]
        public int height { get; set; } = -1;

        [DataMember(Name = "uix")]
        public int uix { get; set; } = -1;

        [DataMember(Name = "uiy")]
        public int uiy { get; set; } = -1;

        [DataMember(Name = "uiwidth")]
        public int uiwidth { get; set; } = -1;

        [DataMember(Name = "uiheight")]
        public int uiheight { get; set; } = -1;

        [DataMember(Name = "data")]
        public string data { get; set; }

        [DataMember(Name = "c")]
        public int c { get; set; }

        [System.Xml.Serialization.XmlElement("referenceTimeStamp", IsNullable = true)]
        [DataMember(Name = "referenceTimeStamp")]
        public DateTime? referenceTimeStamp { get; set; }

        [DataMember(Name = "base64Screenshot")]
        public string base64Screenshot { get; set; }

        [DataMember(Name = "fields")]
        public NativeMessagingMessageFields fields { get; set; }
    }
}
