(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [defun]]))

(defun prepend-newline [editor]
  (let [[lines lines'] (split-at (:y (core/get-cursor editor)) (core/get-strings editor))]
    (-> editor
        (core/set-strings (concat lines [""] lines'))
        cursor/start-line)))

(defun append-newline [editor]
  (let [[lines lines'] (split-at (inc (:y (core/get-cursor editor))) (core/get-strings editor))]
    (-> editor
        (core/set-strings (vec (concat lines [""] lines')))
        cursor/down)))

(defun insert-newline [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        [lines lines'] (split-at y buffer)]
    (-> editor
        (core/set-strings (vec (concat lines [(subs line 0 x) (subs line x (count line))])))
        cursor/down
        cursor/start-line)))

(defun insert [editor string]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)
        y (:y cursor)
        buffer (core/get-strings editor)
        line (get buffer y)
        line' (str (subs line 0 x) string (subs line x (count line)))]
    (-> editor
        (core/set-strings (assoc buffer y line'))
        (core/set-cursor (assoc cursor :x (+ x (count string)))))))

(defun delete-forward [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (core/set-strings editor (assoc buffer
                                 y
                                 (str (subs line 0 x) (subs line (inc x) (count line)))))
      editor)))

(defun delete-backward [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (-> editor
          (core/set-strings (assoc buffer
                              y
                              (str (subs line 0 (dec x)) (subs line x (count line)))))
          cursor/left)
      editor)))

(defun delete-line [editor]
  (let [[lines lines'] (split-at (:y (core/get-cursor editor)) (core/get-strings editor))]
    (-> editor
        (core/set-strings (concat lines (rest lines')))
        cursor/up
        cursor/down)))

(defun replace-character [editor string]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)]
    (core/set-strings editor (assoc buffer y (str (subs line 0 x) string (subs line (inc x) (count line)))))))
