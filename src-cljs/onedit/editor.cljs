(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [defun]]))

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

(defun buffer [editor id]
  (let [key (keyword id)
        buffers (:buffers editor)]
    (if (contains? buffers key)
      (assoc editor
        :current key)
      (assoc editor
        :buffers (assoc buffers
                   key core/unit-buffer)
        :current key))))
