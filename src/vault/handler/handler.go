package handler

import(
    "fmt"
    "html/template"
    "io/ioutil"
    "net/http"
    "path/filepath"
    "regexp"
    "strings"
    "github.com/nathanwinther/go-uuid4"
    "vault/config"
    "vault/flashdata"
    "vault/logger"
    "vault/session"
)

type Handler struct {
    Rules []*Rule
    Templates *template.Template
    header string
}

type Rule struct {
    Pattern string
    Compiled *regexp.Regexp
    Handler func(http.ResponseWriter, *http.Request)
}

func New() (*Handler, error) {
    h := new(Handler)

    h.header = config.Get("response_header")

    h.Rules = []*Rule {
        &Rule{"GET:/vault", nil, h.handleHome},
        &Rule{"GET:/vault/message", nil, h.handleMessage},
        &Rule{"GET:/vault/purge", nil, h.handlePurge},
        &Rule{"GET:/vault/verify/[A-Za-z0-9][A-Za-z0-9-]*", nil, h.handleVerify},
        &Rule{"POST:/vault/pull", nil, h.handlePullPost},
        &Rule{"POST:/vault/push", nil, h.handlePushPost},
        &Rule{"POST:/vault/verify", nil, h.handleVerifyPost},
    }

    // Compile rules
    for _, rule := range h.Rules {
        re, err := regexp.Compile(fmt.Sprintf("^%s$",
            strings.TrimRight(rule.Pattern, "/")))
        if err != nil {
            panic(err)
        }
        rule.Compiled = re
    }

    err := h.loadTemplates()
    if err != nil {
        return nil, err
    }

    return h, nil
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    b := []byte(fmt.Sprintf("%s:/%s", r.Method, strings.Trim(r.URL.Path, "/")))

    rid, _ := uuid4.New()
    w.Header().Add(h.header, rid)

    logger.Log(w, "INCOMING", string(b))

    for _, rule := range h.Rules {
        if rule.Compiled.Match(b) {
            rule.Handler(w, r)
            return
        }
    }

    h.serveNotFound(w, r)
}

func (h *Handler) handleHome(w http.ResponseWriter, r *http.Request) {
    s, err := session.Parse(r)
    if err != nil {
        logger.Error(w, err)
        m := map[string] interface{} {
            "baseurl": config.Get("baseurl"),
        }
        h.Templates.ExecuteTemplate(w, "anon.html", m)
        return
    }

    s.Save(w, true)

    m := map[string] interface{} {
        "baseurl": config.Get("baseurl"),
    }

    h.Templates.ExecuteTemplate(w, "home.html", m)
}

func (h *Handler) handleMessage(w http.ResponseWriter, r *http.Request) {
    s, ok := flashdata.Get(w, r)
    if !ok {
        http.Redirect(w, r, config.Get("baseurl"), http.StatusFound)
        return
    }

    s = strings.Replace(s, "\n", "<br>\n", -1)
    logger.Info(w, s)

    m := map[string] interface{} {
        "baseurl": config.Get("baseurl"),
        "message": template.HTML(s),
    }

    h.Templates.ExecuteTemplate(w, "message.html", m)
}

func (h *Handler) handlePullPost(w http.ResponseWriter, r *http.Request) {
    _, err := session.Parse(r)
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    b, err := ioutil.ReadFile(config.Get("vault_data"))
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    h.sendTextResponse(w, r, b)
}

func (h *Handler) handlePushPost(w http.ResponseWriter, r *http.Request) {
    _, err := session.Parse(r)
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    b := []byte(r.FormValue("data"))

    err = ioutil.WriteFile(config.Get("vault_data"), b, 0644)
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    h.sendTextResponse(w, r, b)
}

func (h *Handler) handlePurge(w http.ResponseWriter, r *http.Request) {
    err := h.loadTemplates()
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    w.Header().Add("Content-Type", "text/plain")
    w.Write([]byte("Templates Reloaded"))
}

func (h *Handler) handleVerify(w http.ResponseWriter, r *http.Request) {
    segments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
    vkey := segments[2]

    s, err := session.Verify(vkey)
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    s.Save(w, true)

    http.Redirect(w, r, config.Get("baseurl"), http.StatusFound)
}

func (h *Handler) handleVerifyPost(w http.ResponseWriter, r *http.Request) {
    err := session.SendVerify()
    if err != nil {
        logger.Error(w, err)
        h.serveServerError(w, r)
        return
    }

    flashdata.Set(w, "Verification link sent to your email address")

    url := fmt.Sprintf("%s/message", config.Get("baseurl"))
    http.Redirect(w, r, url, http.StatusFound)
}

func (h *Handler) loadTemplates() error {
    t, err := template.ParseGlob(filepath.Join(config.Get("templates"), "*.*"))
    if err != nil {
        return err
    }

    h.Templates = t

    return nil
}

func (h *Handler) sendTextResponse(w http.ResponseWriter, r *http.Request, b []byte) {
    w.Header().Add("Content-Type", "text/plain")
    w.Write(b)
}

func (h *Handler) serveNotFound(w http.ResponseWriter, r *http.Request) {
    m := map[string] interface{} {
        "baseurl": config.Get("baseurl"),
    }
    w.WriteHeader(http.StatusNotFound)
    h.Templates.ExecuteTemplate(w, "error404.html", m)
}

func (h *Handler) serveServerError(w http.ResponseWriter, r *http.Request) {
    m := map[string] interface{} {
        "baseurl": config.Get("baseurl"),
    }
    w.WriteHeader(http.StatusInternalServerError)
    h.Templates.ExecuteTemplate(w, "error500.html", m)
}

