(ns one.test
  (:require [clojure.test.generative.generators :as gen]
            [one.core.data :as data]
            [one.core.lens :as lens]
            [one.core.state :as state])
  (:use [clojure.test :only [is are]]
        [clojure.test.generative :only [defspec]]))

(def editor
  (data/->Editor {:scratch (data/->Buffer [""] (data/->Cursor 0 0))}
                 :scratch))

(def pos (partial gen/uniform 0))

(def text (partial gen/vec gen/string))

(defn buffer []
  (let [text (text)
        text' (if (empty? text) [""] text)
        y (pos (count text'))]
    (data/->Buffer text' (data/->Cursor (pos (inc (count (text' y)))) y))))

(defspec buffer-spec
  identity
  [^one.test/buffer buffer]
  (is (< (-> buffer :cursor :y) (-> buffer :text count))))

(def cursor (partial :cursor buffer))

(defn editorx []
  (let [current (gen/keyword)]
    (data/->Editor {current (buffer)}
                   current)))

(defn set-buffer [buffer]
  (->> editor
       (lens/set data/text (:text buffer))
       (lens/set data/cursor (:cursor buffer))))

(defn run [s lens]
  (fn [value]
    (->> editor
         (lens/set lens value)
         (state/run s))))

(defn state-is [lens' value' s]
  (are [value] (= value value')
       (lens/get lens' (.state s))
       (.value s)))

(comment

(deftest text
  (testing "delete line"
    (are [x y] (= x y)
         (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["world"] :cursor (cursor/saved-cursor 0 0)}))
         (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello"] :cursor (cursor/saved-cursor 0 0)})))
    (testing "with buffer has one line"
      (is (= (text/delete-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text [""] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "delete forward"
    (is (= (text/delete-forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hel world"] :cursor (cursor/saved-cursor 3 0)}))))
    (is (= (text/delete-forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello"] :cursor (cursor/saved-cursor 5 0)})))))
  (testing "delete backward"
    (is (= (text/delete-backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["lo world"] :cursor (cursor/saved-cursor 0 0)}))))
    (is (= (text/delete-backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 6 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["world"] :cursor (cursor/saved-cursor 0 0)})))))
  (testing "delete from cursor"
    (is (= (text/delete-from (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hel"] :cursor (cursor/saved-cursor 3 0)})))))
  (testing "delete to cursor"
    (is (= (text/delete-to (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 3 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["lo world"] :cursor (cursor/saved-cursor 0 0)}))))))

(deftest cursor
  (testing "move left"
    (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)}))))
    (testing "with start cursor of line"
      (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))))
    (testing "with start cursor of buffer"
      (is (= (cursor/left (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "move right"
    (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)}))))
    (testing "with end cursor of line"
      (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))))
    (testing "with end cursor of buffer"
      (is (= (cursor/right (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))))
  (testing "move up"
    (is (= (cursor/up (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)}))
                        :view (view/view 5 2)))
           (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 0)}))
             :view (view/view 5 2))))
    (testing "with top cursor of buffer"
      (is (= (cursor/up (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 0)}))
                          :view (view/view 5 2)))
             (assoc (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
               :view (view/view 5 2)))))
    (testing "with lines has diffrent length"
      (is (= (cursor/up (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hell" "world"] :cursor (cursor/saved-cursor 5 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hell" "world"] :cursor (cursor/->Cursor 4 0 5)}))))))
  (testing "move down"
    (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))
    (testing "with bottom cursor of buffer"
      (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 1 1)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))))
    (testing "with lines has diffrent length"
      (is (= (cursor/down (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "word"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "word"] :cursor (cursor/->Cursor 4 1 5)}))))))
  (testing "move start line"
    (are [x y] (= x y)
         (cursor/start-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
         (cursor/start-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)}))))
  (testing "move end line"
    (are [x y] (= x y)
         (cursor/end-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)}))
         (cursor/end-line (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))))
  (testing "move next word"
    (is (= (cursor/forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 1 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)}))))
    (testing "with cursor before white space"
      (is (= (cursor/forward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 5 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 11 0)}))))))
  (testing "move previous word"
    (is (= (cursor/backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 1 0)})))
           (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)}))))
    (testing "with cursor after white space"
      (is (= (cursor/backward (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 6 0)})))
             (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello world"] :cursor (cursor/saved-cursor 0 0)}))))))
  (testing "move start buffer"
    (are [x y] (= x y)
         (cursor/start-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))
         (cursor/start-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)}))))
  (testing "move end buffer"
    (are [x y] (= x y)
         (cursor/end-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 0)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)}))
         (cursor/end-buffer (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 0 1)})))
         (core/set-buffer (editor/editor) (buffer/map->Buffer {:text ["hello" "world"] :cursor (cursor/saved-cursor 5 1)})))))

(deftest minibuffer
  (testing "history"
    (testing "previous command"
      (is (= (minibuffer/prev-command (assoc (editor/editor)
                                     :history (minibuffer/->History "hello" ["hello" "world"] 0)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (nil? (minibuffer/prev-command (assoc (editor/editor)
                                     :history (minibuffer/->History  "hello" ["hello" "world"] 1)))))))
    (testing "next command"
      (is (= (minibuffer/next-command (assoc (editor/editor)
                                     :history (minibuffer/->History "hello" ["hello" "world"] 1)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (nil? (minibuffer/next-command (assoc (editor/editor)
                                          :history (minibuffer/->History "hello" ["hello" "world"] 0)))))))
    (testing "set previous command"
      (is (= (minibuffer/set-prev-command (assoc (editor/editor)
                                         :history (minibuffer/->History "hello" ["hello" "world"] 0)))
             (assoc (editor/editor)
               :history (minibuffer/->History "world" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (= (minibuffer/set-prev-command (assoc (editor/editor)
                                           :history (minibuffer/->History "world" ["hello" "world"] 1)))
               (assoc (editor/editor)
                 :history (minibuffer/->History "world" ["hello" "world"] 1))))))
    (testing "set next command"
      (is (= (minibuffer/set-next-command (assoc (editor/editor)
                                         :history (minibuffer/->History "world" ["hello" "world"] 1)))
             (assoc (editor/editor)
               :history (minibuffer/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (= (minibuffer/set-next-command (assoc (editor/editor)
                                           :history (minibuffer/->History "hello" ["hello" "world"] 0)))
               (assoc (editor/editor)
                 :history (minibuffer/->History "hello" ["hello" "world"] 0)))))))
  (testing "eval command"
    (is (= (minibuffer/eval-command (assoc (editor/editor)
                                      :current :minibuffer
                                      :minibuffer (assoc minibuffer/default-minibuffer :command "get-buffer hello")))
           (->> (editor/editor)
                (buffer/get-buffer :hello)
                (minibuffer/add-history "get-buffer hello"))))))

(deftest buffer
  (testing "create buffer"
    (is (= (buffer/create-buffer :world (assoc (editor/editor)
                                          :buffers {:hello buffer/default-buffer}
                                          :current :hello))
           (assoc (editor/editor)
             :buffers {:hello buffer/default-buffer
                       :world buffer/default-buffer}
             :current :world)))
    (testing "with name exists on buffers"
      (is (= (buffer/create-buffer :hello (assoc (editor/editor)
                                            :buffers {:hello buffer/default-buffer}
                                            :current :hello))
             (assoc (editor/editor)
               :buffers {:hello buffer/default-buffer}
               :current :hello)))))
  (testing "change buffer"
    (is (= (buffer/change-buffer :world (assoc (editor/editor)
                                   :buffers {:hello buffer/default-buffer
                                             :world buffer/default-buffer}
                                   :current :hello))
           (assoc (editor/editor)
             :buffers {:hello buffer/default-buffer
                       :world buffer/default-buffer}
             :current :world)))
    (testing "with name not exists on buffers"
      (is (= (buffer/change-buffer :world (assoc (editor/editor)
                                     :buffers {:hello buffer/default-buffer}
                                     :current :hello))
             (assoc (editor/editor)
               :buffers {:hello buffer/default-buffer}
               :current :hello)))))
  (testing "create or change buffer"
    (are [x y] (= x y)
         (buffer/get-buffer :world (assoc (editor/editor)
                                     :buffers {:hello buffer/default-buffer}
                                     :current :hello))
         (assoc (editor/editor)
           :buffers {:hello buffer/default-buffer
                     :world buffer/default-buffer}
           :current :world)
         (buffer/get-buffer :world (assoc (editor/editor)
                                     :buffers {:hello buffer/default-buffer
                                               :world buffer/default-buffer}
                                     :current :hello))
         (assoc (editor/editor)
           :buffers {:hello buffer/default-buffer
                     :world buffer/default-buffer}
           :current :world)))
  (testing "rename buffer"
    (is (= (buffer/rename-buffer :world (assoc (editor/editor)
                                          :buffers {:hello buffer/default-buffer}
                                          :current :hello))
           (assoc (editor/editor)
             :buffers {:world buffer/default-buffer}
             :current :world))))
  (testing "get all buffers"
    (is (= (buffer/buffers (assoc (editor/editor)
                             :buffers {:hello buffer/default-buffer
                                       :world buffer/default-buffer}
                             :current :hello))
           (assoc (editor/editor)
             :buffers {:hello buffer/default-buffer
                       :world buffer/default-buffer
                       :buffers (assoc buffer/default-buffer
                                  :text ["hello" "world"])}
             :current :buffers)))))

(deftest view
  (testing "view"
    (testing "up"
      (is (= (view/up (-> (editor/editor)
                          (assoc :view (view/->View 0 1 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 0 5 1))
                 (core/set-text ["hello" "world"]))))
      (testing "above view"
        (is (= (view/up (-> (editor/editor)
                          (assoc :view (view/->View 0 0 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 0 5 1))
                 (core/set-text ["hello" "world"]))))))
    (testing "down"
      (is (= (view/down (-> (editor/editor)
                          (assoc :view (view/->View 0 0 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 1 5 1))
                 (core/set-text ["hello" "world"]))))
      (testing "below view"
        (is (= (view/down (-> (editor/editor)
                          (assoc :view (view/->View 0 1 5 1))
                          (core/set-text ["hello" "world"])))
             (-> (editor/editor)
                 (assoc :view (view/->View 0 1 5 1))
                 (core/set-text ["hello" "world"]))))))))

(deftest mode
  (testing "key"
    (testing "for general mode"
      (is (= (core/input (assoc (editor/editor) :mode mode/general-mode) :a)
             (text/insert "a" (assoc (editor/editor) :mode mode/general-mode)))))))

(deftest parser
  (testing "parse command"
    (is (= (parser/parse-command "f a" (assoc (editor/editor) :functions {:f :function}))
           (list :function "a")))))

)
