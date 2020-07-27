'use strict';
(async () => {
  const $siteURL = document.querySelector('#site-url')
  const $submitButton = document.querySelector('#submit-button')
  const $json = document.querySelector('#json')
  const $spinner = document.querySelector('#spinner')
  $spinner.hidden = true
  let network = null

  const getColor = status => {
    const colors = {
      200: '#33AF13',
      418: '#2437C2',
      500: '#F6D20E',
      403: '#F17700',
      429: '#FF55A7'
    }
    return colors[status] || '#F12424'
  }

  const getNodes = sitemap => {
    const nodes = []
    const urls = []
    const rec = node => {
      if (!urls.includes(node.url)) {
        urls.push(node.url)
        nodes.push({
          id: node.url,
          label: node.url,
          shape: 'box',
          color: getColor(node.status),
          margin: 10, x: 0, y: 0,
          font: {
            color: '#ffffff'
          }
        })
      }
      node.children.forEach(child => rec(child))
    }
    rec(sitemap)
    return nodes
  }

  const getEdges = sitemap => {
    const edges = []
    const rec = node => {
      node.children.forEach(child => {
        edges.push({
          from: node.url,
          to: child.url,
          arrows: 'to',
          length: 250
        })
      })
      node.children.forEach(child => rec(child))
    }
    rec(sitemap)
    return edges
  }

  const scanWebiste = async url => {
    $spinner.hidden = false
    const json = await (await fetch(`scan?url=${url}`)).json()
    network = new vis.Network($json, {
      nodes: getNodes(json),
      edges: getEdges(json)
    }, {})
    network.on("doubleClick", params => {
      window.open(params.nodes[0], '_blank')
    })
    $spinner.hidden = true
  }

  const onSubmit = () => {
    scanWebiste($siteURL.value)
  }

  $siteURL.addEventListener('keyup', e => {
    $submitButton.disabled = !$siteURL.checkValidity()  
  })

  $siteURL.addEventListener('keydown', e => {
    if (e.keyCode == 13) {
      onSubmit()
    }
  })

  $submitButton.addEventListener('click', e => {
    e.preventDefault()
    onSubmit()
  })
})();
