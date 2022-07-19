using System;
using System.Runtime.Serialization;

namespace OpenRPA.Interfaces
{
    [Serializable]
    [DataContract]
    public class NativeMessagingMessageTab
    {
        [DataMember(Name = "browser")]
        public string browser { get; set; }

        [DataMember(Name = "active")]
        public bool active { get; set; }

        [DataMember(Name = "audible")]
        public bool audible { get; set; }

        [DataMember(Name = "autoDiscardable")]
        public bool autoDiscardable { get; set; }

        [DataMember(Name = "discarded")]
        public bool discarded { get; set; }

        [DataMember(Name = "favIconUrl")]
        public string favIconUrl { get; set; }

        [DataMember(Name = "height")]
        public int height { get; set; }

        [DataMember(Name = "highlighted")]
        public bool highlighted { get; set; }

        [DataMember(Name = "id")]
        public int id { get; set; }

        [DataMember(Name = "incognito")]
        public bool incognito { get; set; }

        [DataMember(Name = "index")]
        public int index { get; set; }

        [DataMember(Name = "pinned")]
        public bool pinned { get; set; }

        [DataMember(Name = "selected")]
        public bool selected { get; set; }

        [DataMember(Name = "status")]
        public string status { get; set; }

        [DataMember(Name = "title")]
        public string title { get; set; }

        [DataMember(Name = "url")]
        public string url { get; set; }

        [DataMember(Name = "width")]
        public int width { get; set; }

        [DataMember(Name = "windowId")]
        public int windowId { get; set; }
    }
}
