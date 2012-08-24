(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [goog.array :as garray]
            [onedit.core :as core]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [fn-map]]))

(defn insert-newline [editor y]
  (let [[lines lines'] (split-at y (core/get-strings editor))]
    (-> editor
        (core/set-strings (concat lines [""] lines')))))

(defn prepend-newline [editor]
  (-> editor
      (insert-newline (:y (core/get-cursor editor)))
      cursor/start-line))

(defn append-newline [editor]
  (-> editor
      (insert-newline (inc (:y (core/get-cursor editor))))
      cursor/down))

(defn insert-newline [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        [lines lines'] (split-at y buffer)]
    (-> editor
        (core/set-strings (vec (concat lines [(subs line 0 x) (subs line x (count line))])))
        cursor/down
        cursor/start-line)))

(defn insert [editor string]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)
        y (:y cursor)
        buffer (core/get-strings editor)
        line (get buffer y)
        line' (str (subs line 0 x) string (subs line x (count line)))]
    (-> editor
        (core/set-strings (assoc buffer y line'))
        (core/set-cursor (assoc cursor :x (+ x (count string)))))))

(defn delete-forward [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (core/set-strings editor (assoc buffer
                                 y
                                 (str (subs line 0 x) (subs line (inc x) (count line)))))
      editor)))

(defn delete-backward [editor]
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

(defn delete-line [editor]
  (let [[lines lines'] (split-at (:y (core/get-cursor editor)) (core/get-strings editor))]
    (-> editor
        (core/set-strings (vec (concat lines (rest lines'))))
        cursor/up
        cursor/down
        cursor/start-line)))

(defn replace-character [editor string]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)]
    (core/set-strings editor (assoc buffer y (str (subs line 0 x) string (subs line (inc x) (count line)))))))

(def functions
  (merge (fn-map insert
                 append-newline
                 prepend-newline
                 delete-forward
                 delete-backward
                 delete-line
                 replace-character)
         {:i insert
          :o append-newline
          :O prepend-newline
          :x delete-forward
          :X delete-backward
          :dd delete-line
          :r replace-character}))
