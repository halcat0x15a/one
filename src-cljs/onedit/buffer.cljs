(ns onedit.buffer
  (:require [clojure.string :as string]
            [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.util :as util]))

(defn add-newline [editor y]
  (let [[lines lines'] (split-at y (core/get-strings editor))]
    (core/set-strings editor (vec (concat lines (list "") lines')))))

(defn prepend-newline [editor]
  (-> editor
      (add-newline (core/get-y editor))
      cursor/start-line))

(defn append-newline [editor]
  (-> editor
      (add-newline (inc (core/get-y editor)))
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
        (core/set-cursor (core/set-saved cursor (+ x (count string)))))))

(defn delete [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (core/set-strings editor (assoc buffer
                                 y (util/drop-string x (inc x) line)))
      editor)))

(defn backspace [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)
        length (count line)]
    (if (> length 0)
      (-> editor
          (core/set-strings (assoc buffer
                              y (util/drop-string (dec x) x line)))
          cursor/left)
      editor)))

(defn delete-line [editor]
  (let [[lines lines'] (split-at (:y (core/get-cursor editor)) (core/get-strings editor))]
    (-> editor
        (core/set-strings (vec (cons "" (concat lines (rest lines')))))
        cursor/up
        cursor/down
        cursor/start-line)))

(defn replace-character [editor string]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)]
    (core/set-strings editor (assoc buffer y (str (subs line 0 x) string (subs line (inc x) (count line)))))))
