(ns onedit.core
  (:require [clojure.string :as string]))

(defrecord Cursor [x y saved])

(def unit-cursor (Cursor. 0 0 0))

(defrecord Buffer [strings cursor])

(def unit-buffer (Buffer. [""] unit-cursor))

(defrecord History [commands cursor])

(def unit-history (History. (list "") 0))

(defrecord Editor [buffers current history functions])

(def unit-editor (Editor. {"scratch" unit-buffer} "scratch" unit-history {}))

(def current-editor (atom unit-editor))

(defn get-buffer [^Editor editor]
  ((:buffers editor) (:current editor)))

(def get-cursor (comp :cursor get-buffer))

(def get-cursor-x (comp :x get-cursor))

(def get-cursor-y (comp :y get-cursor))

(def get-strings (comp :strings get-buffer))

(def get-string (comp (partial string/join "\n") get-strings))

(defn set-buffer [editor buffer]
  (assoc editor
    :buffers (assoc (:buffers editor)
               (:current editor) buffer)))

(defn set-cursor [editor cursor]
  (set-buffer editor (assoc (get-buffer editor)
                       :cursor cursor)))

(defn set-strings [editor strings]
  (set-buffer editor (assoc (get-buffer editor)
                       :strings strings)))

(defn set-string [editor str]
  (set-strings editor (string/split-lines str)))

(defn saved-cursor [x y]
  (Cursor. x y x))

(defn set-saved [cursor x]
  (assoc cursor :x x :saved x))

(defn update-buffer [editor f]
  (let [buffers (:buffers editor)
        current (:current editor)]
    (assoc editor
      :buffers (assoc buffers
                 current (f (buffers current))))))

(defn update-strings [editor f]
  (update-buffer editor #(assoc %
                           :strings (f (:strings %)))))

(def count-lines (comp count get-strings))

(defn get-line
  ([editor] (get-line editor (:y (get-cursor editor))))
  ([editor y]
     (get (get-strings editor) y)))

(def count-line
  (comp
   #(when-let [line %]
      (count line))
   get-line))

(defn parse-command [editor s]
  (let [[f & args] (string/split s #"\s+")]
    (when-let [f ((:functions editor) f)]
      (cons f args))))
