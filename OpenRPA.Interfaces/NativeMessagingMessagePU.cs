using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace OpenRPA.Interfaces
{
    [Serializable]
    [DataContract]
    public class NativeMessagingMessagePU
    {
        [DataMember(Name = "fields")]
        [JsonProperty("fields")]
        public IDictionary<string, FieldPU> fields { get; set; }

        [DataMember(Name = "context")]
        [JsonProperty("context")]
        public FieldPU context { get; set; }
    }

    [Serializable]
    [DataContract]
    public class FieldPU
    {
        [DataMember(Name = "type")]
        [JsonProperty("type")]
        public string type { get; set; }

        [DataMember(Name = "ruleType")]
        [JsonProperty("rule_type")]
        public string ruleType { get; set; }

        [DataMember(Name = "color")]
        [JsonProperty("color")]
        public string color { get; set; }

        [DataMember(Name = "id")]
        [JsonProperty("id")]
        public Guid id { get; set; }

        [DataMember(Name = "nearbyLabelsIds")]
        [JsonProperty("nearby_labels_ids")]
        public object[] nearbyLabelsIds { get; set; }

        [DataMember(Name = "relevantAttrs")]
        [JsonProperty("relevant_attrs")]
        public RelevantAttrs relevantAttrs { get; set; }
        
        [DataMember(Name = "xPathFull")]
        [JsonProperty("xPathFull")]
        public string xPathFull { get; set; }

        [DataMember(Name = "selector")]
        [JsonProperty("selector")]
        public string selector { get; set; }

        [DataMember(Name = "nearbyLabelsElements")]
        [JsonProperty("nearby_label_elements")]
        public FieldPU[] nearbyLabelsElements { get; set; }

        [DataMember(Name = "closestRuleElementId")]
        [JsonProperty("closest_rule_element_id")]
        public string closestRuleElementId { get; set; }

        [DataMember(Name = "closestRuleElement")]
        [JsonProperty("closest_rule_element")]
        public FieldPU closestRuleElement { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RelevantAttrs
    {
        [DataMember(Name = "boundingRect")]
        [JsonProperty("bounding_rect")]
        public BoundingRect boundingRect { get; set; }

        [DataMember(Name = "outerText")]
        [JsonProperty("outerText")]
        public string outerText { get; set; }

        [DataMember(Name = "innerText")]
        [JsonProperty("innerText")]
        public string innerText { get; set; }

        [DataMember(Name = "id")]
        [JsonProperty("id")]
        public object id { get; set; }

        [DataMember(Name = "class")]
        [JsonProperty("class")]
        public string @class { get; set; }

        [DataMember(Name = "title")]
        [JsonProperty("title")]
        public object title { get; set; }

        [DataMember(Name = "alt")]
        [JsonProperty("alt")]
        public object alt { get; set; }

        [DataMember(Name = "src")]
        [JsonProperty("src")]
        public object src { get; set; }

        [DataMember(Name = "href")]
        [JsonProperty("href")]
        public object href { get; set; }

        [DataMember(Name = "role")]
        [JsonProperty("role")]
        public string role { get; set; }

        [DataMember(Name = "placeholder")]
        [JsonProperty("placeholder")]
        public object placeholder { get; set; }

        [DataMember(Name = "for")]
        [JsonProperty("for")]
        public object @for { get; set; }

        [DataMember(Name = "name")]
        [JsonProperty("name")]
        public object name { get; set; }

        [DataMember(Name = "value")]
        [JsonProperty("value")]
        public object value { get; set; }

        [DataMember(Name = "disabled")]
        [JsonProperty("disabled")]
        public object disabled { get; set; }

        [DataMember(Name = "readonly")]
        [JsonProperty("readonly")]
        public object @readonly { get; set; }

        [DataMember(Name = "required")]
        [JsonProperty("required")]
        public object required { get; set; }

        [DataMember(Name = "checked")]
        [JsonProperty("checked")]
        public object @checked { get; set; }

        [DataMember(Name = "selected")]
        [JsonProperty("selected")]
        public object selected { get; set; }

        [DataMember(Name = "ariaLabel")]
        [JsonProperty("aria-label")]
        public string ariaLabel { get; set; }

        [DataMember(Name = "ariaLabelledby")]
        [JsonProperty("aria-labelledby")]
        public object ariaLabelledby { get; set; }

        [DataMember(Name = "ariaDescribedby")]
        [JsonProperty("aria-describedby")]
        public object ariaDescribedby { get; set; }

        [DataMember(Name = "maxlength")]
        [JsonProperty("maxlength")]
        public object maxlength { get; set; }

        [DataMember(Name = "min")]
        [JsonProperty("min")]
        public object min { get; set; }

        [DataMember(Name = "max")]
        [JsonProperty("max")]
        public object max { get; set; }

        [DataMember(Name = "accessibleNameRef")]
        [JsonProperty("accessible-name-ref")]
        public object accessibleNameRef { get; set; }
    }

    [Serializable]
    [DataContract]
    public class BoundingRect
    {
        [DataMember(Name = "x")]
        [JsonProperty("x")]
        public double x { get; set; }

        [DataMember(Name = "y")]
        [JsonProperty("y")]
        public long y { get; set; }

        [DataMember(Name = "width")]
        [JsonProperty("width")]
        public long width { get; set; }

        [DataMember(Name = "height")]
        [JsonProperty("height")]
        public long height { get; set; }
    }
}
