(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [fn-map]]))

(defn get-cursor
  ([] (core/->Cursor (get-cursor "left") (get-cursor "top")))
  ([attr] (let [str (aget (aget (dom/ensure-element :cursor) "style") attr)]
            (int (subs str 0 (- (count str) 2))))))

(defn get-strings []
  (-> (dom/ensure-element :buffer)
      gdom/getRawTextContent
      string/split-lines))

(def get-buffer (comp (partial apply core/->Buffer) (juxt get-strings get-cursor)))

(defn unit []
  (core/->Editor {:scratch (get-buffer)} :scratch))

(defn update [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        style (str "left: " x "ex; top: " y "em;")]
    (dom/set-properties (dom/ensure-element :cursor) {"style" style})
    (dom/set-text (dom/ensure-element :buffer) (string/join (interpose \newline (core/get-strings editor))))))

(defn buffer [editor id]
  (let [key (keyword id)
        buffers (:buffers editor)]
    (assoc (if (contains? buffers key)
             editor
             (assoc editor
               :buffers (assoc buffers
                          key core/unit-buffer)))
      :current key)))

(defn delete-buffer [editor id]
  (assoc editor
    :buffers (dissoc (:buffers editor) id)))

(defn buffers [editor]
  (letfn [(set-buffers [editor]
            (core/set-strings editor (map name (keys (:buffers editor)))))]
    (-> editor
        (buffer :buffers)
        set-buffers)))

(defn grep [editor string]
  (let [re (re-pattern string)]
    (-> editor
        (buffer :grep)
        (core/set-strings (filter (partial re-find re) (core/get-strings editor))))))

(def functions
  (fn-map delete-buffer
          buffer
          buffers
          grep))
