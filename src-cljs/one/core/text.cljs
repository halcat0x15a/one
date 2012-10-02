(ns one.core.text
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.core.cursor :as cursor]
            [one.core.state :as state]
            [one.core.lens :as lens]))

(defn add-newline [y]
  (lens/modify lens/text
               #(vec (concat (take y %) (list "") (drop y %)))))

(def prepend-newline
  (state/bind (lens/get lens/cursor-y)
              (fn [y]
                (state/bind' (add-newline y)
                             cursor/start-line))))

(def append-newline
  (state/bind (lens/get lens/cursor-y)
              (fn [y]
                (state/bind' (add-newline (inc y))
                             cursor/down))))

(def insert-newline
  (state/bind (lens/get lens/cursor)
              (fn [cursor]
                (state/bind' (lens/modify lens/text
                                          #(let [{:keys [x y]} cursor
                                                 [text text'] (split-at y %)
                                                 line (first text')]
                                             (vec (concat text (list (subs line 0 x) (subs line x)) (rest text')))))
                             cursor/down
                             cursor/start-line))))

(defn insert [s]
  (state/bind (lens/get lens/cursor)
              (fn [cursor]
                (let [{:keys [x y]} cursor]
                  (state/bind' (lens/modify (lens/line y)  #(str (subs % 0 x) s (subs % x)))
                               (lnes/set lens/cursor (cursor/set-saved cursor (+ x (count s)))))))))

(def delete
  (state/bind (lens/get lens/cursor)
              (fn [cursor]
                (let [{:keys [x y]} cursor]
                  (lens/modify (lens/line y) #(if (> (count %) x) (str (subs % 0 x) (subs % (inc x))) %))))))

(def backspace
  (state/bind (lens/cursor lens/cursor)
              (fn [cursor]
                (let [{:keys [x y]} cursor]
                  (if (> x 0)
                    (state/bind' (lens/modify (lens/line y) #(str (subs % 0 (dec x)) (subs % x)))
                                 cursor/left)
                    state/get)))))

(def delete-line
  (state/bind (lens/get lens/cursor-y)
              (fn [y]
                (state/bind' (lens/modify lens/text #(let [text (concat (take y %) (drop (inc y) %))]
                                                       (if (empty? text) [""] (vec text))))
                             cursor/up
                             cursor/down
                             cursor/start-line))))

(def delete-forward
  (state/bind (lens/get lens/cursor)
              (fn [cursor]
                (state/bind state/get
                            (fn [editor]
                              (let [{:keys [x y]} cursor
                                    x' (state/eval (state/bind' cursor/forward
                                                                (lens/get lens/cursor-x))
                                                   editor)]
                                (lens/modify (lens/line y) #(str (subs % 0 x)
                                                                 (subs % x')))))))))

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
