(ns one.core.cursor
  (:require [clojure.string :as string]
            [one.core.record :as record]
            [one.core.view :as view]
            [one.core.lens :as lens]
            [one.core.util :as util]))

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

(defn right [editor]
  (letfn [(right' [cursor]
            (let [{:keys [x y]} cursor]
              (if (< x (util/count-line y editor))
                (assoc cursor :x (inc x))
                cursor)))]
    (lens/modify lens/cursor right' editor)))

(defn move-while [editor pred f]
  (loop [editor editor]
    (let [{:keys [x y]} (lens/lens-get lens/cursor editor)
          editor' (f editor)]
      (if-let [character (str (get (lens/lens-get (lens/line y) editor) x))]
        (if (and (not= editor' editor) (pred character))
          (recur editor')
          editor)
        editor))))

(defn forward [editor]
  (-> editor
      (move-while string/blank? right)
      (move-while (comp not string/blank?) right)))

(defn backward [editor]
  (-> editor
      left
      (move-while string/blank? left)
      (move-while (comp not string/blank?) left)
      (move-while string/blank? right)))

(def start-line
  (partial lens/lens-set lens/cursor-x 0))

(defn end-line [editor]
  (lens/modify lens/cursor #(assoc % :x (util/count-line (:y %) editor)) editor))

(def start-buffer
  (partial lens/modify lens/cursor #(assoc % :x 0 :y 0)))

(defn end-buffer [editor]
  (letfn [(end-buffer' [cursor]
            (let [y' (dec (util/count-lines editor))]
              (assoc cursor
                :x (util/count-line y' editor)
                :y y')))]
    (lens/modify lens/cursor end-buffer' editor)))
