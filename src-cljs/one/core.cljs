(ns one.core
  (:require [clojure.string :as string]))

(defrecord Cursor [x y saved])

(def unit-cursor (Cursor. 0 0 0))

(defn saved-cursor [x y]
  (Cursor. x y x))

(defn set-saved [cursor x]
  (assoc cursor :x x :saved x))

(defrecord Buffer [strings cursor])

(def unit-buffer (Buffer. [""] unit-cursor))

(defrecord View [x y width height])

(def unit-view (View. 0 0 0 0))

(defrecord History [commands cursor])

(def unit-history (History. (list "") 0))

(defrecord Mode [name function])

(def unit-mode (Mode. :one {}))

(defrecord Editor [buffers current view history functions mode])

(def default-buffer :scratch)

(def unit-editor (Editor. {:scratch unit-buffer} default-buffer unit-view unit-history {} unit-mode))

(def current-editor (atom unit-editor))

(defn get-buffer [editor]
  ((:buffers editor) (:current editor)))

(defn update-buffer [editor f]
  (let [buffers (:buffers editor)
        current (:current editor)]
    (assoc editor
      :buffers (assoc buffers
                 current (f (buffers current))))))

(defn set-buffer [editor buffer]
  (assoc editor
    :buffers (assoc (:buffers editor)
               (:current editor) buffer)))

(def get-cursor (comp :cursor get-buffer))

(def get-cursor-x (comp :x get-cursor))

(def get-cursor-y (comp :y get-cursor))

(defn set-cursor [editor cursor]
  (update-buffer editor #(assoc % :cursor cursor)))

(def get-strings (comp :strings get-buffer))

(def get-string (comp (partial string/join \newline) get-strings))

(defn update-strings [editor f]
  (update-buffer editor #(assoc % :strings (f (:strings %)))))

(defn set-strings [editor strings]
  (update-buffer editor #(assoc % :strings strings)))

(defn set-string [editor str]
  (set-strings editor (string/split-lines str)))

(def count-lines (comp count get-strings))

(defn get-line
  ([editor] (get-line editor (get-cursor-y editor)))
  ([editor y]
     (get (get-strings editor) y)))

(defn set-line
  ([editor string] (set-line editor (get-cursor-y editor) string))
  ([editor y string]
     (update-strings editor #(assoc % y string))))

(defn update-line
  ([editor f] (update-line editor (get-cursor-y editor) f))
  ([editor y f]
     (update-strings editor #(assoc % y (f (get % y))))))

(def count-line
  (comp #(when-let [line %] (count line)) get-line))

(defn cursor-position [editor]
  (let [{:keys [cursor strings]} (get-buffer editor)
        strings (take (:y cursor) strings)]
    (+ (:x cursor) (count strings) (apply + (map count strings)))))

(defn parse-command [editor s]
  (let [[f & args] (string/split s #"\s+")]
    (when-let [f ((:functions editor) (keyword f))]
      (cons f args))))

(defn mode [editor name f]
  (assoc editor :mode (Mode. name f)))
