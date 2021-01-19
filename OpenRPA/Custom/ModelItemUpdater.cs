using System;
using System.Activities.Presentation.Model;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using OpenRPA.Interfaces;
using OpenRPA.Interfaces.entity;
using OpenRPA.Interfaces.Image;

namespace OpenRPA.Custom
{
    public static class ModelItemUpdater
    {
        public static string[] PropertyNamesOfTypeImage = { "Image", "FullImage"};

        public static async Task<string> SetPropertyOnSaveWorkflowAsync(Workflow workflow, ModelItem item,
            string propertyName, string imagePath)
        {
            var image = item?.Properties[propertyName]?.Value?.ToString();

            if (string.IsNullOrWhiteSpace(image) || string.IsNullOrEmpty(workflow._id)) return "";

            if (Regex.Match(image, "[a-f0-9]{24}").Success) return image;

            var metadata = new metadata
            {
                _acl = workflow._acl,
                workflow = workflow._id
            };

            var imageId = GenericTools.YoutubeLikeId();

            var tempFileName = Path.Combine(Path.GetTempPath(), imageId + ".png");

            using (var ms = new MemoryStream(Convert.FromBase64String(image)))
            {
                using (var b = new Bitmap(ms))
                {
                    b.Save(tempFileName, ImageFormat.Png);
                }
            }

            var id = await global.webSocketClient.UploadFile(tempFileName, "", metadata);
            var filename = Path.Combine(imagePath, id + ".png");
            File.Copy(tempFileName, filename, true);
            File.Delete(tempFileName);
            item.SetValue(propertyName,id);
            return id;
        }

        public static async Task SetPropertyOnLoadImagesAsync(ModelItem item, string propertyName)
        {
            var image = item?.Properties[propertyName]?.Value?.ToString();

            if (string.IsNullOrWhiteSpace(image) || !Regex.Match(image, "[a-f0-9]{24}").Success) return;

            using (var b = await Util.LoadBitmap(image))
            {
                item.Properties[propertyName].SetValue(Util.Bitmap2Base64(b));
            }
        }
    }
}