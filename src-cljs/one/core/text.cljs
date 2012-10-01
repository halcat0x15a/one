(ns one.core.text
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.core.cursor :as cursor]
            [one.core.lens :as lens]))

(defn add-newline [editor y]
  (lens/modify editor lens/text #(vec (concat (take y %) (list "") (drop y %)))))

(defn prepend-newline [editor]
  (-> editor
      (add-newline ((:get lens/cursor-y) editor))
      cursor/start-line))

(defn append-newline [editor]
  (-> editor
      (add-newline (inc ((:get lens/cursor-y) editor)))
      cursor/down))

(defn insert-newline [editor]
  (-> editor
      (lens/modify lens/text #(let [{:keys [x y]} ((:get lens/cursor) editor)
                                    [text text'] (split-at y %)
                                    line (first text')]
                                (vec (concat text (list (subs line 0 x) (subs line x)) (rest text')))))
      cursor/down
      cursor/start-line))

(defn insert [editor s]
  (let [cursor ((:get lens/cursor) editor)
        {:keys [x y]} cursor
        set-cursor (:set lens/cursor)]
    (-> editor
        (lens/modify (lens/line y)  #(str (subs % 0 x) s (subs % x)))
        (set-cursor (cursor/set-saved cursor (+ x (count s)))))))

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
        (core/set-cursor (cursor/set-saved cursor 0)))))

(defn replace-text [editor s]
  (let [x (core/get-cursor-x editor)]
    (core/update-line editor #(str (subs % 0 x) s (subs % (+ x (count s)))))))
