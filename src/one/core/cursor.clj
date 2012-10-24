(ns one.core.cursor
  (:require [one.core.data :as data]
            [one.core.state :as state])
  (:use;*CLJSBUILD-REMOVE*;-macros
   [one.core.macros :only [defdata for-m do-m]]))

(def left
  (state/modify data/x
                (fn [x]
                  (if (pos? x)
                    (dec x)
                    x))))

(def down
  (do-m [text (state/get data/text)]
        (state/modify data/y
                      (fn [y]
                        (if (< y (dec (count text)))
                          (inc y)
                          y)))))

(def up
  (state/modify data/y
                (fn [y]
                  (if (pos? y)
                    (dec y)
                    y))))

(def right
  (do-m [line (state/get data/line)]
         (state/modify data/x
                       (fn [x]
                         (if (< x (count line))
                           (inc x)
                           x)))))

(def start-line
  (state/set data/x 0))

(def end-line
  (do-m [line (state/get data/line)]
        (state/set data/x (count line))))

(comment
(def start-buffer
  (partial lens/modify lens/cursor #(assoc % :x 0 :y 0)))

(defn end-buffer [editor]
  (letfn [(end-buffer' [cursor]
            (let [y' (dec (util/count-lines editor))]
              (assoc cursor
                :x (util/count-line y' editor)
                :y y')))]
    (lens/modify lens/cursor end-buffer' editor)))

(def forward
  (partial modify-cursor-with util/find-forward))

(def backward
  (partial modify-cursor-with util/find-backward))
)