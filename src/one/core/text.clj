(ns one.core.text
  (:require [clojure.string :as string])
  (:use [one.core.macros :only [do-m]]))

(defn insert [s editor]
  (do-m [cursor (state/get data/cursor)
         _ (state/set data/cursor (assoc cursor :x (+ (:x cursor) (count s))))]
        (state/modify data/line
                      (fn [line]
                        (str (subs line 0 (:x cursor)) s (subs line (:x cursor)))))))

(comment
(def prepend-newline
  (do-m [text (state/get data/text)
         y (state/get data/y)
         #_ cursor/start-line
         [a b] (split-at y text)]
        (state/modify data/text (vec (concat a '(\newline) b)))))

(def append-newline
  (do-m [text (state/get data/text)
         y (state/get data/y)
         [a b] (split-at (inc y text))
         #_ cursor/start-line
         #_ cursor/down]
        (lens/modify lens/text (vec (concat a '(\newline) b)))))

(defn insert-newline [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (->> editor
         (lens/modify lens/text (partial util/insert-newline x y))
         cursor/down
         cursor/start-line)))

(defn delete [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (letfn [(delete' [line]
              (if (< x (count line))
                (str (subs line 0 x) (subs line (inc x)))
                line))]
      (lens/modify (lens/line y) delete' editor))))

(defn backspace [editor]
  (let [{:keys [x y]} (lens/lens-get lens/cursor editor)]
    (if (pos? x)
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
                   (subs line (util/find-forward line x))))]
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
)