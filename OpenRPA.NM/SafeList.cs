using OpenRPA.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;

namespace OpenRPA.NM
{
    public class SafeList<T>
    {
        protected readonly List<T> list;

        public SafeList()
        {
            list = new List<T>();
        }

        public void Add(T elem)
        {
            lock (list)
            {
                list.Add(elem);
            }
        }

        public void Clear()
        {
            lock (list)
            {
                list.Clear();
            }
        }

        public void Remove(T elem)
        {
            lock (list)
            {
                list.Remove(elem);
            }
        }

        public T FirstOrDefault(Func<T, bool> predicate)
        {
            lock (list)
            {
                return list.FirstOrDefault(predicate);
            }
        }

        public IEnumerable<T> Where(Func<T, bool> predicate)
        {
            lock (list)
            {
                return list.Where(predicate);
            }
        }

        public void ForEach(Action<T> func)
        {
            lock (list)
            {
                list.ForEach(func);
            }
        }
    }
}
