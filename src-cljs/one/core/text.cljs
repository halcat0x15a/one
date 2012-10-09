(ns one.core.text
  (:require [clojure.string :as string]
            [one.core.record :as record]
            [one.core.lens :as lens]
            [one.core.util :as util]
            [one.core.cursor :as cursor]))

(defn prepend-newline [editor]
  (->> editor
       (lens/modify lens/text (partial util/insert-newline (lens/lens-get lens/cursor-y editor)))
       cursor/start-line))

(defn append-newline [editor]
  (->> editor
       (lens/modify lens/text (partial util/insert-newline (inc (lens/lens-get lens/cursor-y editor))))
       cursor/down))

(defn insert-newline [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (->> editor
         (lens/modify lens/text (partial util/insert-newline x y))
         cursor/down
         cursor/start-line)))

(defn insert [s editor]
  (let [cursor (lens/lens-get lens/cursor editor)
        {:keys [x y]} cursor]
    (->> editor
         (lens/modify (lens/line y) #(str (subs % 0 x) s (subs % x)))
         (lens/lens-set lens/cursor (cursor/set-saved (+ x (count s)) cursor)))))

(defn delete [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (letfn [(delete' [line]
              (if (> (count line) x)
                (str (subs line 0 x) (subs line (inc x)))
                line))]
      (lens/modify (lens/line y) delete' editor))))

(defn backspace [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (if (> x 0)
      (->> editor
           (lens/modify (lens/line y) #(str (subs % 0 (dec x)) (subs % x)))
           cursor/left)
      editor)))

(defn delete-line [editor]
  (letfn [(delete-line' [text]
            (let [y (lens/lens-get lens/cursor-y editor)
                  text' (concat (take y text) (drop (inc y) text))]
              (if (empty? text') [""] (vec text'))))]
    (->> editor
         (lens/modify lens/text delete-line')
         cursor/up
         cursor/down
         cursor/start-line)))

(defn delete-forward [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (letfn [(delete-forward' [line]
              (str (subs line 0 x)
                   (subs line (->> editor cursor/forward (lens/lens-get lens/cursor-x)))))]
      (lens/modify (lens/line y) delete-forward' editor))))

(defn delete-backward [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)
        cursor (->> editor cursor/backward (lens/lens-get lens/cursor))]
    (letfn [(delete-backward' [line]
              (str (subs line 0 (:x cursor))
                   (subs line x)))]
      (->> editor
           (lens/modify (lens/line y) delete-backward')
           (lens/lens-set lens/cursor cursor)))))

(defn delete-from [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (lens/modify (lens/line y) #(subs % 0 x) editor)))

(defn delete-to [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (->> editor
         (lens/modify (lens/line y) #(subs % x))
         (lens/lens-set lens/cursor (record/saved-cursor 0 y)))))

(defn replace-text [s editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (lens/modify (lens/line y) #(str (subs % 0 x) s (subs % (+ x (count s)))) editor)))
