(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [clojure.browser.event :as event]
            [goog.dom :as gdom]
            [goog.events :as gevents]
            [goog.array :as garray]
            [goog.events.EventType :as gevents-type]
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

(declare exec)

(defn listen [minibuffer editor]
  (gevents/removeAll minibuffer gevents-type/CHANGE)
  (event/listen-once minibuffer gevents-type/CHANGE (partial exec editor)))

(defn update
  ([editor] (update editor (dom/ensure-element :minibuffer)))
  ([editor minibuffer]
     (let [{:keys [x y]} (core/get-cursor editor)
           style (str "left: " x "ex; top: " y "em;")]
       (dom/set-properties (dom/ensure-element :cursor) {"style" style})
       (dom/set-text (dom/ensure-element :buffer) (string/join (interpose \newline (core/get-strings editor))))
       (listen minibuffer editor)
       editor)))

(defn get-function [function]
  ((keyword function) onedit/functions))

(defn exec [editor event]
  (let [minibuffer (dom/ensure-element :minibuffer)
        value (dom/get-value minibuffer)
        [f & args] (string/split value #"\s+")]
    (if-let [function (get-function f)]
      (let [editor' (apply function (cons (core/set-buffer editor (get-buffer)) args))]
        (dom/set-value minibuffer "")
        (update editor')
        (listen minibuffer editor'))
      (listen minibuffer editor))))

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

(defn commands [editor]
  (-> editor
      (buffer :commands)
      (core/set-strings (map name (keys onedit/functions)))))

(defn count-lines [editor]
  (-> editor
      (buffer :count-lines)
      (core/set-strings [(str (core/count-lines editor))])))

(defn apply-buffers [editor command & args]
  (let [f (get-function command)]
    (loop [editor editor buffers (:buffers editor) result []]
      (if (empty? buffers)
        (-> editor
            (buffer :apply-buffers)
            (core/set-strings result))
        (let [[k v] (first buffers)
              editor' (apply f (-> editor (buffer k)) args)]
          (recur editor' (rest buffers) (concat result (core/get-strings editor'))))))))

(defn sum [editor]
  (-> editor
      (buffer :sum)
      (core/set-strings [(str (apply + (map int (flatten (map (partial re-seq #"\d+") (core/get-strings editor))))))])))

(def functions
  (fn-map delete-buffer
          buffer
          buffers
          grep
          commands
          count-lines
          sum
          apply-buffers))
