(ns one.buffer
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.cursor :as cursor]
            [one.util :as util]))

(defn add-newline [editor y]
  (core/update-strings
   editor
   (comp vec (partial util/insert (list "") y))))

(defn prepend-newline [editor]
  (-> editor
      (add-newline (core/get-cursor-y editor))
      cursor/start-line))

(defn append-newline [editor]
  (-> editor
      (add-newline (inc (core/get-cursor-y editor)))
      cursor/down))

(defn insert-newline [editor]
  (let [{:keys [x y]} (core/get-cursor editor)
        [lines lines'] (split-at y (core/get-strings editor))]
    (-> editor
        (core/set-strings (vec (concat lines (util/cut x (first lines')) (rest lines'))))
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
  (let [[lines lines'] (split-at (:y (core/get-cursor editor)) (core/get-strings editor))
        lines (concat lines (rest lines'))]
    (-> editor
        (core/set-strings (if (empty? lines) [""] (vec lines)))
        cursor/up
        cursor/down
        cursor/start-line)))

(defn delete-forward [editor]
  (core/update-line editor #(str (subs % 0 (core/get-cursor-x editor))
                                 (subs % (core/get-cursor-x (cursor/forward editor))))))

(defn delete-backward [editor]
  (let [cursor (core/get-cursor (cursor/backward editor))]
    (-> editor
        (core/update-line #(str (subs % 0 (:x cursor))
                                (subs % (core/get-cursor-x editor))))
        (core/set-cursor cursor))))

(defn delete-from [editor]
  (core/update-line editor #(subs % 0 (core/get-cursor-x editor))))

(defn delete-to [editor]
  (let [cursor (core/get-cursor editor)]
    (-> editor
        (core/update-line #(subs % (:x cursor)))
        (core/set-cursor (core/set-saved cursor 0)))))

(defn replace-string [editor string]
  (let [{:keys [x y]} (core/get-cursor editor)
        buffer (core/get-strings editor)
        line (get buffer y)]
    (core/set-strings editor (assoc buffer y (str (subs line 0 x) string (subs line (+ x (count string))))))))
