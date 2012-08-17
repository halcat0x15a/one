(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [onedit.core :as core]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [defun]]))

(defn create []
  (string/split-lines (gdom/getRawTextContent (dom/ensure-element :buffer))))

(defn update [buffer]
  (dom/set-text :buffer (string/join (interpose \newline buffer))))

(defun prepend-newline [editor]
  (let [[lines lines'] (split-at (:y (:cursor editor)) (:buffer editor))]
    (-> editor
        (assoc :buffer (cons "" (:buffer editor)))
        cursor/start-line))

(defun append-newline [editor]
  (let [[lines lines'] (split-at (inc (:y (:cursor editor))) (:buffer editor))]
    (-> editor
        (assoc :buffer (vec (concat lines [""] lines')))
        cursor/down)))

(defun insert-newline [editor]
  (let [{:keys [x y]} (:cursor editor)
        buffer (:buffer editor)
        line (get buffer y)
        [lines lines'] (split-at y buffer)]
    (assoc editor
      :buffer (concat lines [(subs line 0 x) (subs line x (count line))] lines'))))

(defun insert [editor string]
  (let [cursor (:cursor editor)
        x (:x cursor)
        y (:y cursor)
        buffer (:buffer editor)
        line (get buffer y)
        line' (str (subs line 0 x) string (subs line x (count line)))]
    (assoc editor
      :buffer (assoc buffer y line')
      :cursor (assoc cursor
                :x (+ x (count string))))))

(defun delete-forward [editor]
  (let [{:keys [x y]} (:cursor editor)
        buffer (:buffer editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (assoc editor
        :buffer (assoc buffer
                  y
                  (str (subs line 0 x) (subs line (inc x) (count line)))))
      editor)))

(defun delete-backward [editor]
  (let [{:keys [x y]} (:cursor editor)
        buffer (:buffer editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (-> editor
          (assoc editor
            :buffer (assoc buffer
                      y
                      (str (subs line 0 (dec x)) (subs line x (count line)))))
          cursor/left)
      editor)))
