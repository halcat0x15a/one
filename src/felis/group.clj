(ns felis.group
;*CLJSBUILD-REMOVE*;  (:use-macros [felis.macros :only (tag)])
  (:require [clojure.string :as string]
            [felis.style :as style]
            [felis.buffer :as buffer]
            [felis.node :as node]
            [felis.minibuffer :as minibuffer]
            [felis.default :as default]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(defn render [buffer minibuffer]
  (tag :html {}
       (tag :head {}
            (tag :style {:type "text/css"}
                 "<!-- "
                 (->> style/all (interpose \space) string/join)
                 " -->"))
       (tag :body {}
            (tag :div {:class "editor"}
                 (node/render buffer)
                 (node/render minibuffer)))))

(defrecord Group [buffer minibuffer]
  node/Node
  (render [_] (render buffer minibuffer)))

(def path [:root])

(def default (Group. buffer/default minibuffer/default))

(defmethod node/path Group [_] path)

(defmethod default/default Group [_] default)
