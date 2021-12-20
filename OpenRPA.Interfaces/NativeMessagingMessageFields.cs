using OpenRPA.NamedPipeWrapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenRPA.Interfaces
{
    [Serializable]
    public class NativeMessagingMessageFields
    {
        public string list { get; set; }
        public long length { get; set; }
        public long contextId { get; set; }
    }
}
