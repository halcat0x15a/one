(ns one.core.cursor
  (:require [clojure.string :as string]
            [one.core.record :as record]
            [one.core.view :as view]
            [one.core.lens :as lens]
            [one.core.util :as util]))

(defn modify-cursor-with [f editor]
  (let [cursor (lens/lens-get lens/cursor editor)
        {:keys [x y]} cursor
        line (lens/lens-get (lens/line y) editor)]
    (lens/lens-set lens/cursor (assoc cursor :x (f line x)) editor)))

(def left
  (partial lens/modify lens/cursor-x #(if (pos? %) (dec %) %)))

(defn down [editor]
  (letfn [(down' [y]
            (if (< y (dec (util/count-lines editor)))
              (inc y)
              y))]
    (lens/modify lens/cursor-y down' editor)))

(def up
  (partial lens/modify lens/cursor-y #(if (pos? %) (dec %) %)))

(def right
  (partial modify-cursor-with
           (fn [line x]
             (if (< x (count line))
               (inc x)
               x))))

(def start-line
  (partial lens/lens-set lens/cursor-x 0))

(def end-line
  (partial modify-cursor-with
           (fn [line _]
             (count line))))

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
  (partial modify-cursor-with (partial util/move-while-word inc)))

(def backward
  (partial modify-cursor-with (comp inc (partial util/move-while-word dec))))
