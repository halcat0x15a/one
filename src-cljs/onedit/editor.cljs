(ns onedit.editor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.style :as gstyle]
            [onedit.core :as core]
            [onedit.style :as style])
  (:use-macros [onedit.core :only [fn-map]]))

(defn get-strings []
  (->> (dom/ensure-element :buffer)
       gdom/getChildren
       (map gdom/getRawTextContent)
       vec))

(defn update [editor]
  (gstyle/setStyle (dom/ensure-element :cursor) (style/cursor-style (core/get-cursor editor)))
  (doto (dom/ensure-element :pointer)
    (dom/set-text style/pointer)
    (gstyle/setStyle (style/pointer-style)))
  (doto (dom/ensure-element :space)
    (dom/set-text (subs (core/get-line editor) 0 (:x (core/get-cursor editor))))
    (gstyle/setStyle (style/space-style)))
  (doto (dom/ensure-element :buffer)
    (gstyle/setStyle (style/buffer-style)))
  (dom/remove-children :buffer)
  (letfn [(f [e] (dom/append (dom/element :p) e))]
    (dom/log (core/get-strings editor))
    (doseq [e (map f (core/get-strings editor))]
      (dom/append (dom/ensure-element :buffer) e)))
  (reset! core/current-editor editor))

(defn get-function [function]
  ((keyword function) onedit/functions))

(defn exec [event]
  (let [minibuffer (dom/ensure-element :minibuffer)
        value (dom/get-value minibuffer)
        [f & args] (string/split value #"\s+")]
    (when-let [function (get-function f)]
      (let [editor' (apply function (core/set-strings @core/current-editor (get-strings)) args)]
        (dom/set-value minibuffer "")
        (update editor')))))

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
