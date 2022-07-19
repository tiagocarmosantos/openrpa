using System;
using System.Runtime.Serialization;

namespace OpenRPA.Interfaces
{
    [Serializable]
    [DataContract]
    public class NativeMessagingMessageFields
    {
        [DataMember(Name = "list")]
        public string list { get; set; }

        [DataMember(Name = "length")]
        public long length { get; set; }

        [DataMember(Name = "contextId")]
        public long contextId { get; set; }
    }
}
