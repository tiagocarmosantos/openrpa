using System.Windows;
using System.Windows.Media.Imaging;

namespace OpenRPA.NM.Activities
{
    /// <summary>
    /// 
    /// </summary>
    public partial class ScreenshotHighlightView : Window
    {
        public ScreenshotHighlightView(BitmapImage image)
        {
            InitializeComponent();
            DataContext = new ScreenshotHighlightViewModel() { HighlightScreen = image };
        }
    }
}
