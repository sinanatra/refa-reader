# ReFa Reader Template

![refa](https://github.com/sinanatra/refa-reader-template/assets/20107875/10b7a524-8e54-4b36-a704-fa1e4d7efac8)


An interactive visualization that juxtaposes essays and graphs. 
It allows readers to browse JSON-LD data, by accessing them through a curated selection of texts designed to provide better understanding, combining editorial approaches with free exploration and usear-driven granularity.


## Prerequisites

To make full use of the ReFa Reader, you will need:

1. A JSON-LD Dataset: This template requires data in JSON-LD format, typically exported from a semantic or linked data database.


2. Node.js and Yarn Installed: Ensure you have Node.js and Yarn installed on your development machine. If not, download and install them before proceeding.

> ⚠️ If you work with Omeka S, use this [repository](https://github.com/sinanatra/refa-reader-template).

## Data Preparation

When exporting a JSON-LD from a semantic database, it is important to keep a few steps in mind:

1. Add a `title` for each node, by default it is the `@id`.
2. Add a `path` for media, to display images. By default, nothing is displayed.
3. If you want to customise the property label, add a `property` for this.

In the following example, `title`, `image` and `label` have been added:

```
{
  "@context": "https://uclab.fh-potsdam.de/refa-catalog/api-context",
  "@id": "https://uclab.fh-potsdam.de/refa-catalog/api/items/48",
  "title": "Bildnis eines Herrn im Justacorps, Weste und Chapeau Bras",
  "image":  "https://uclab.fh-potsdam.de/refa-catalog/files/large/7ce42d2af5bcc90ef7c944a96c873b43a53970b6.jpg",
  "ecrm:P48_has_preferred_identifier": [
    {
      "label": "P48 has preferred identifier",
      "@value": "M_153_536"
    }
  ],
}
```

## Installation
### Project setup

1. In the Terminal, go to your production folder:

```
cd path/to/my/folder
```

2. Clone this repository
```
git clone https://github.com/sinanatra/refa-reader-template.git
cd refa-reader-template
```

3. Install dependencies with yarn
```
yarn
```

4. Run and build the development environment.
```
yarn dev
yarn build
```

5. Preview the production build with `yarn preview`. 

6. Deploy to Github with : `yarn deploy`

## Configuration

> All the markdown urls are crawled in the `src/routes/[slug]/+page.js`:

### Markdowns

Essays need to be inserted inside the `src/route/texts/` folder.<br>
Every markdown contains metadata to customize the layout:

```
---
title: The title of the essay.
date: "2023-12-14"
color: "blue"
author: "Name of the Author"
isPublic: true // false
lang: en
description: "The description which appears in the home page"
cover: "https://example.com/image.jpg"
---
```

### Setup
To configure the graph visualisation it is needed to customise the setup file in the `src/setup.json`. <br>


```
{
    "title": "The title of the Website",
    "api": "https://exampe.com/api", // The link to a Omeka S Api
    "local": "db.json", // Alternatively, the path to the JSON-LD
     "paths": { // customise the property for the resource title and images
        "title": "o:title", 
        "img": [
            "thumbnail_display_urls", 
            "large" // This would allow the nesting of properties
        ]
    },
    "publicSite": "", // The link of an Omeka-S collection 
    "languages": ["en"],
    "description": {
        "en": "Text to render in the homepage"
    }, 
    "mainCategories": [
        // It is possible to customise the column layout by specifing a category and properties as a js Object. 
        {
            "key": "Category title",
            "props": [
                "is refered to it",
                "shows features of",
            ]
        },
       ...
    ],
    "descriptionSeo": "metadata field for SEO",
    "imageSeo": "image path SEO"

}
```
