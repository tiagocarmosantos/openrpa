using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace OpenRPA.Views
{
    /// <summary>
    /// Interaction logic for EditXAML.xaml
    /// </summary>
    public partial class SplashScreen : Window, System.ComponentModel.INotifyPropertyChanged
    {

        private DateTime StartDt;
        protected override void OnClosing(CancelEventArgs e)
        {
            var deltaTime = DateTime.Now - StartDt;
            if (deltaTime.TotalSeconds < 5 )
            {
                var waitTime = new TimeSpan(0, 0, 5) - deltaTime;
                Thread.Sleep((int)waitTime.TotalMilliseconds);
            }

            base.OnClosing(e);
        }


        public SplashScreen()
        {
            InitializeComponent();
            DataContext = this;
            StartDt = DateTime.Now;
        }
        public event System.ComponentModel.PropertyChangedEventHandler PropertyChanged;
        public void NotifyPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new System.ComponentModel.PropertyChangedEventArgs(propertyName));
        }
        public string _XAML;
        public string XAML
        {
            get { return _XAML; }
            set
            {
                _XAML = value;
                NotifyPropertyChanged("XAML");
            }
        }
        public string BusyContent
        {
            get
            {
                {
                    string result = null;
                    Dispatcher.Invoke(new Action(() =>
                    {
                        result = BusyIndicator.BusyContent as string;
                    }), null);
                    return result;
                }
            }
            set
            {
                Dispatcher.Invoke(new Action(() =>
                {
                    BusyIndicator.BusyContent = value;
                }), null);
            }
        }
        public bool IsBusy
        {
            get
            {
                {
                    bool result = false;
                    Dispatcher.Invoke(new Action(() =>
                    {
                        result = BusyIndicator.IsBusy;
                    }), null);
                    return result;
                }
            }
            set
            {
                Dispatcher.Invoke(new Action(() =>
                {
                    BusyIndicator.IsBusy = value;
                }), null);
            }
        }
        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            //Console.WriteLine("Window_Loaded");
            //BusyIndicator.IsBusy = true;
            //BusyIndicator.BusyContent = "Initializing...";
            //var worker = new System.ComponentModel.BackgroundWorker();
            //worker.DoWork += (o, a) =>
            //{
            //    for (int index = 0; index < 5; index++)
            //    {
            //        BusyContent = "Loop : " + index;
            //        Console.WriteLine("Loop : " + index);
            //        System.Threading.Thread.Sleep(new TimeSpan(0, 0, 1));
            //    }
            //};
            //worker.RunWorkerCompleted += (o, a) =>
            //{
            //    IsBusy = false;
            //};
            //worker.RunWorkerAsync();
        }

        private void Image_MouseDown(object sender, MouseButtonEventArgs e)
        {
             System.Diagnostics.Process.Start("https://www.my-invenio.com");
        }

        private void Image_MouseEnter(object sender, MouseEventArgs e)
        {
            if (Cursor != Cursors.Wait) Mouse.OverrideCursor = Cursors.Hand;
        }

        private void Image_OnMouseLeave(object sender, MouseEventArgs e)
        {
            if (Cursor != Cursors.Wait)
                Mouse.OverrideCursor = Cursors.Arrow;
        }
    }
}
