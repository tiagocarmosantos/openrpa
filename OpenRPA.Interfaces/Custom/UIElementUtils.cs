using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using FlaUI.Core.AutomationElements;
using OpenRPA.Interfaces.Image;

namespace OpenRPA.Interfaces.Custom
{
    // ReSharper disable once InconsistentNaming
    public static class UIElementUtils
    {
        private static Bitmap CropAtRect(System.Drawing.Image b, Rectangle r)
        {
            var nb = new Bitmap(r.Width, r.Height);
            using (var g = Graphics.FromImage(nb))
            {
                g.InterpolationMode=InterpolationMode.High;
                g.DrawImage(b, -r.X, -r.Y);
                return nb;
            }
        }

        private static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            return ImageCodecInfo.GetImageDecoders().FirstOrDefault(codec => codec.FormatID == format.Guid);
        }

        private static string SaveImageWithTheRightQuality(Bitmap original)
        {
            var encoderParameters = new EncoderParameters(1)
            {
                Param = {[0] = new EncoderParameter(Encoder.Quality, 60L)}
            };

            original.SetResolution(96F, 96F);

            var jgpEncoder = GetEncoder(ImageFormat.Jpeg);

            using (original)
            {
                using (var ms = new MemoryStream())
                {
                    original.Save(ms, jgpEncoder, encoderParameters);

                    return Convert.ToBase64String(ms.GetBuffer());
                }
            }
        }

        public static string FullImageString(UIElement element, AutomationElement rootElem)
        {
            const int addedWidth = 10;
            const int addedHeight = 10;
            var screenImageWidth = element.Rectangle.Width + addedWidth;
            var screenImageHeight = element.Rectangle.Height + addedHeight;
            var screenImageX = element.Rectangle.X - addedWidth / 2;
            var screenImageY = element.Rectangle.Y - addedHeight / 2;
            if (screenImageX < 0) screenImageX = 0;
            if (screenImageY < 0) screenImageY = 0;
            using (var screenShot = Util.Screenshot())
            {
                using (var newGraphics = Graphics.FromImage(screenShot))
                {
                    var customColor = Color.FromArgb(50, Color.Red);
                    var highlightBrush = new SolidBrush(customColor);
                    newGraphics.FillRectangle(highlightBrush, screenImageX, screenImageY, screenImageWidth, screenImageHeight);
                    return SaveImageWithTheRightQuality(CropAtRect(screenShot, rootElem.BoundingRectangle));
                }
            }
        }
    }
}