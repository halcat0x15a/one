(ns one.core.buffer
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.core.cursor :as cursor]))

(defn add-newline [editor y]
  (core/update-text editor #(vec (concat (take y %) (list "") (drop y %)))))

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
        [lines lines'] (split-at y (core/get-text editor))
        line (first lines')]
    (-> editor
        (core/set-text (vec (concat lines (list (subs line 0 x) (subs line x)) (rest lines'))))
        cursor/down
        cursor/start-line)))

(defn insert [editor s]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)]
    (-> editor
        (core/update-line #(str (subs % 0 x) s (subs % x)))
        (core/set-cursor (core/set-saved cursor (+ x (count s)))))))

(defn delete [editor]
  (let [{:keys [cursor text]} (core/get-buffer editor)
        {:keys [x y]} cursor
        line (text y)
        length (count line)]
    (if (> length x)
      (core/set-line editor (str (subs line 0 x) (subs line (inc x))))
      editor)))

(defn backspace [editor]
  (let [{:keys [cursor text]} (core/get-buffer editor)
        {:keys [x y]} cursor
        line (text y)]
    (if (> x 0)
      (-> editor
          (core/set-line (str (subs line 0 (dec x)) (subs line x)))
          cursor/left)
      editor)))

(defn delete-line [editor]
  (let [{:keys [cursor text]} (core/get-buffer editor)
        [lines lines'] (split-at (:y cursor) text)
        lines (concat lines (rest lines'))]
    (-> editor
        (core/set-text (if (empty? lines) [""] (vec lines)))
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

(defn replace-text [editor s]
  (let [x (core/get-cursor-x editor)]
    (core/update-line editor #(str (subs % 0 x) s (subs % (+ x (count s)))))))
