(ns onedit.core
  (:require [clojure.string :as string]))

(defrecord Cursor [x y saved])

(def unit-cursor (Cursor. 0 0 0))

(defrecord Buffer [strings cursor])

(def unit-buffer (Buffer. [""] unit-cursor))

(defrecord History [commands cursor])

(def unit-history (History. (list "") 0))

(defrecord Editor [buffers current history functions])

(def unit-editor (Editor. {:scratch unit-buffer} :scratch unit-history (js-obj)))

(def current-editor (atom unit-editor))

(defn get-buffer [editor]
  ((:buffers editor) (:current editor)))

(def get-cursor (comp :cursor get-buffer))

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

(defn update-history [editor f]
  (let [history (:history editor)]
    (assoc editor
      :history (assoc history
                 :commands (f (:commands history))))))

(defn add-history [editor command]
  (update-history editor (partial cons command)))

(defn set-current-command [editor command]
  (update-history editor (comp (partial cons command) rest)))

(defn set-history-cursor [editor cursor]
  (assoc editor
    :history (assoc (:history editor)
               :cursor cursor)))

(defn reset-history [editor]
  (-> editor
      (set-current-command "")
      (set-history-cursor 0)))

(defn get-command [editor]
  (let [history (:history editor)]
    (nth (:commands history) (:cursor history) nil)))

(defn prev-command [editor]
  (let [{:keys [commands cursor]} (:history editor)
        cursor' (inc cursor)]
    (when (< cursor (count commands))
      (set-history-cursor editor cursor'))))

(defn next-command [editor]
  (let [cursor (:cursor (:history editor))
        cursor' (dec cursor)]
    (when (> cursor 0)
      (set-history-cursor editor cursor'))))

(defn set-prev-command [editor]
  (when-let [editor' (prev-command editor)]
    (set-current-command editor' (get-command editor'))))

(defn set-next-command [editor]
  (when-let [editor' (next-command editor)]
    (set-current-command editor' (get-command editor'))))

(defn parse-command [editor s]
  (let [[f & args] (string/split s #"\s+")]
    (when-let [f (aget (:functions editor) f)]
      (cons f args))))
