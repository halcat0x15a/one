(ns one.core
  (:require [clojure.string :as string]))

(defn get-buffer [editor]
  (let [current (:current editor)]
    (case current
      :minibuffer (current editor)
      (current (:buffers editor)))))

(defn set-buffer [editor buffer]
  (let [current (:current editor)]
    (case current
      :minibuffer (assoc editor :minibuffer buffer)
      (assoc editor
        :buffers (assoc (:buffers editor)
                   current buffer)))))

(defn update-buffer [editor f]
  (let [current (:current editor)]
    (case current
      :minibuffer (assoc editor :minibuffer (f (:minibuffer editor)))
      (assoc editor
        :buffers (let [buffers (:buffers editor)]
                   (assoc buffers
                     current (f (buffers current))))))))

(def get-cursor (comp :cursor get-buffer))

(def get-cursor-x (comp :x get-cursor))

(def get-cursor-y (comp :y get-cursor))

(defn set-cursor [editor cursor]
  (update-buffer editor #(assoc % :cursor cursor)))

(defn update-cursor [editor f]
  (update-buffer editor #(assoc % :cursor (f (:cursor %)))))

(def get-text (comp :text get-buffer))

(def get-joined (comp (partial string/join \newline) get-text))

(defn set-text [editor text]
  (update-buffer editor #(assoc % :text text)))

(defn set-joined [editor str]
  (set-text editor (string/split-lines str)))

(defn update-text [editor f]
  (update-buffer editor #(assoc % :text (f (:text %)))))

(def count-lines (comp count get-text))

(defn get-line
  ([editor] (get-line editor (get-cursor-y editor)))
  ([editor y]
     (get (get-text editor) y)))

(defn set-line
  ([editor line] (set-line editor (get-cursor-y editor) line))
  ([editor y line]
     (update-text editor #(assoc % y line))))

(defn update-line
  ([editor f] (update-line editor (get-cursor-y editor) f))
  ([editor y f]
     (update-text editor #(assoc % y (f (get % y))))))

(def count-line
  (comp #(when-let [line %] (count line)) get-line))

(defn cursor-position [editor]
  (let [{:keys [cursor text]} (get-buffer editor)
        text (take (:y cursor) text)]
    (+ (:x cursor) (count text) (apply + (map count text)))))

(defn input [editor key]
  ((:function (:mode editor)) editor key))
