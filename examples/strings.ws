(defn dasherize [string]
  (.toLowerCase (.replace string (RegExp. "([a-z])([A-Z0-9])", "g") "$1-$2")))

(def strings ["PointOf2D"
              "Point"
              ""
              "a-dasherized-name"
              "ACamelCaseName"])

(each strings (fn [string]
  (println (dasherize string))))
