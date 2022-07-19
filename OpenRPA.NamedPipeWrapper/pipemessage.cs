using System;
using System.Runtime.Serialization;

namespace OpenRPA.NamedPipeWrapper
{
    [Serializable]
    [DataContract]
    public class PipeMessage
    {
        private static Random rnd = new Random();
        private static int messagecounter = rnd.Next(100, 9000);

        public PipeMessage()
        {
            ++messagecounter;
            messageid = messagecounter.ToString();
        }

        public PipeMessage(PipeMessage message)
        {
            messageid = message.messageid;
        }

        [DataMember(Name = "messageid")]
        public string messageid { get; set; }

        [DataMember(Name = "error")]
        public object error { get; set; }
    }
}
