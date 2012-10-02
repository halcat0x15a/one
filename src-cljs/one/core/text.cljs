(ns one.core.text
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.core.cursor :as cursor]
            [one.core.lens :as lens]))

(defn add-newline [editor y]
  (lens/modify editor lens/text #(vec (concat (take y %) (list "") (drop y %)))))

(defn prepend-newline [editor]
  (-> editor
      (add-newline ((.get lens/cursor-y) editor))
      cursor/start-line))

(defn append-newline [editor]
  (-> editor
      (add-newline (inc ((.get lens/cursor-y) editor)))
      cursor/down))

(defn insert-newline [editor]
  (letfn [(insert [text]
            (let [{:keys [x y]} ((.get lens/cursor) editor)
                  [text' text''] (split-at y text)
                  line (first text'')]
              (vec (concat text' (list (subs line 0 x) (subs line x)) (rest text'')))))]
    (-> editor
        (lens/modify lens/text insert)
        cursor/down
        cursor/start-line)))

(defn insert [editor s]
  (let [cursor ((.get lens/cursor) editor)
        {:keys [x y]} cursor
        set-cursor (.set lens/cursor)]
    (-> editor
        (lens/modify (lens/line y) #(str (subs % 0 x) s (subs % x)))
        (set-cursor (cursor/set-saved cursor (+ x (count s)))))))

(defn delete [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (letfn [(delete' [line]
              (if (> (count line) x)
                (str (subs line 0 x) (subs line (inc x)))
                line))]
      (lens/modify editor (lens/line y) delete'))))

(defn backspace [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (if (> x 0)
      (-> editor
          (lens/modify (lens/line y) #(str (subs % 0 (dec x)) (subs % x)))
          cursor/left)
      editor)))

(defn delete-line [editor]
  (letfn [(delete-line' [text]
            (let [y ((.get lens/cursor-y) editor)
                  text' (concat (take y text) (drop (inc y) text))]
              (if (empty? text') [""] (vec text'))))]
    (-> editor
        (lens/modify lens/text delete-line')
        cursor/up
        cursor/down
        cursor/start-line)))

(defn delete-forward [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (letfn [(delete-forward' [line]
              (str (subs line 0 x)
                   (subs line ((.get lens/cursor-x) (cursor/forward editor)))))]
      (lens/modify editor (lens/line y) delete-forward'))))

(defn delete-backward [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)
        cursor ((.get lens/cursor) (cursor/backward editor))]
    (letfn [(delete-backward' [line]
              (str (subs line 0 (:x cursor))
                   (subs line x)))]
      (-> editor
          (lens/modify (lens/line y) delete-backward')
          (core/set-cursor cursor)))))

(defn delete-from [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (lens/modify editor (lens/line y) #(subs % 0 x))))

(defn delete-to [editor]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (-> editor
        (lens/modify (lens/line y) #(subs % x))
        ((.set lens/cursor) (cursor/saved-cursor 0 y)))))

(defn replace-text [editor s]
  (let [{:keys [x y]} ((.get lens/cursor) editor)]
    (lens/modify editor (lens/line y) #(str (subs % 0 x) s (subs % (+ x (count s)))))))
