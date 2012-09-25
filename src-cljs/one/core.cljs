(ns one.core
  (:require [clojure.string :as string]))

(defrecord Cursor [^int x ^int y ^int saved])

(def unit-cursor (Cursor. 0 0 0))

(defn saved-cursor [x y]
  (Cursor. x y x))

(defn set-saved [^Cursor cursor x]
  (assoc cursor :x x :saved x))

(defrecord Buffer [strings ^Cursor cursor])

(def unit-buffer (Buffer. [""] unit-cursor))

(defrecord View [x y width height])

(def unit-view (View. 0 0 0 0))

(defrecord History [commands cursor])

(def unit-history (History. (list "") 0))

(defrecord Mode [^clojure.lang.Keyword name keymap])

(def unit-mode (Mode. :one {}))

(defrecord Editor [buffers ^clojure.lang.Keyword current ^History history functions ^Mode mode])

(def unit-editor (Editor. {"scratch" unit-buffer} "scratch" unit-history {} unit-mode))

(def current-editor (atom unit-editor))

(defn get-buffer [^Editor editor]
  ((:buffers editor) (:current editor)))

(defn update-buffer [^Editor editor f]
  (let [buffers (:buffers editor)
        current (:current editor)]
    (assoc editor
      :buffers (assoc buffers
                 current (f (buffers current))))))

(defn set-buffer [^Editor editor ^Buffer buffer]
  (assoc editor
    :buffers (assoc (:buffers editor)
               (:current editor) buffer)))

(def get-cursor (comp :cursor get-buffer))

(def get-cursor-x (comp :x get-cursor))

(def get-cursor-y (comp :y get-cursor))

(defn set-cursor [^Editor editor cursor]
  (update-buffer editor #(assoc % :cursor cursor)))

(def get-strings (comp :strings get-buffer))

(def get-string (comp (partial string/join \newline) get-strings))

(defn update-strings [^Editor editor f]
  (update-buffer editor #(assoc % :strings (f (:strings %)))))

(defn set-strings [^Editor editor strings]
  (update-buffer editor #(assoc % :strings strings)))

(defn set-string [^Editor editor ^String str]
  (set-strings editor (string/split-lines str)))

(def count-lines (comp count get-strings))

(defn get-line
  ([^Editor editor] (get-line editor (get-cursor-y editor)))
  ([^Editor editor y]
     (get (get-strings editor) y)))

(defn set-line
  ([^Editor editor string] (set-line editor (get-cursor-y editor) string))
  ([^Editor editor y string]
     (update-strings editor #(assoc % y string))))

(defn update-line
  ([^Editor editor f] (update-line editor (get-cursor-y editor) f))
  ([^Editor editor y f]
     (update-strings editor #(assoc % y (f (get % y))))))

(def count-line
  (comp #(when-let [line %] (count line)) get-line))

(defn cursor-position [^Editor editor]
  (let [{:keys [cursor strings]} (get-buffer editor)
        strings (take (:y cursor) strings)]
    (+ (:x cursor) (count strings) (apply + (map count strings)))))

(defn parse-command [^Editor editor ^String s]
  (let [[f & args] (string/split s #"\s+")]
    (when-let [f ((:functions editor) (keyword f))]
      (cons f args))))

(defn mode [^Editor editor ^clojure.lang.Keyword name keymap]
  (assoc editor :mode (Mode. name keymap)))
