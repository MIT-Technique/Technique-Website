import React from "react";
import Image from "next/image";

import example1 from "../../../public/images/other_images/Marcelo_Maza/MJM-21.jpg"
import example2 from "../../../public/images/other_images/Ruhundaka_Ejilemele/DSC_3641.jpg"

// To view each component: copy folder to src/app and navigate to localhost:3000/common
function page() {
    return (
        <main className="h-[90%] border-stone-500 border-solid border-8">
            <h3 className="pb-0">Styled tags and components. Default tag and classes in global.css</h3>
            <em className="text-sm">Note: &lt;main&gt; is also styled by default, setting up padding and flex</em>
            <ul className="list-disc pl-4 pb-4">
                <li><a href="#text">Text</a></li>
                <li><a href="#blocks">Styled Blocks</a></li>
                <li><a href="#images">Images</a></li>
            </ul>
            <hr className="border-2 rounded-xl"/>
            <div id="text" className="my-4 p-4">
                <h1>Heading 1 &lt;h1&gt;</h1>
                <h2>Heading 2 &lt;h2&gt;</h2>
                <h3>Heading 3 &lt;h3&gt;</h3>
                <h4>Heading 4 &lt;h4&gt;</h4>
                <p>Paragraph &lt;p&gt;: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu efficitur dolor. Morbi sed libero euismod felis aliquam cursus. Vestibulum aliquet vulputate leo, non lacinia arcu placerat a. Sed sollicitudin id ante sit amet semper. Aenean tincidunt mollis consectetur. Nullam vehicula scelerisque sapien. Phasellus in mauris imperdiet tellus auctor luctus. </p>
            </div>
            <hr className="border-2 rounded-xl"/>
            <div id="blocks" className="my-4 p-4">
                className = &quot;card-container&quot;: re-organizes elements in either a row or column, depending on viewport
                <em className="text-sm">Note: &quot;card-container&quot; isn&apos;t used, but still available</em>
                <div className="border-stone-500 border-4 card-container text-white">
                    <div className="card bg-orange-500">
                        <h3>className = &quot;card&quot;</h3>
                        <p>Preconstructed block, needs only text color and background color.</p>
                        <p>Paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu efficitur dolor. Morbi sed libero euismod felis aliquam cursus. Vestibulum aliquet vulputate leo, non lacinia arcu placerat a. Sed sollicitudin id ante sit amet semper. Aenean tincidunt mollis consectetur. Nullam vehicula scelerisque sapien. Phasellus in mauris imperdiet tellus auctor luctus. </p>
                    </div>
                    <div className="card bg-green-800">
                        <h3>className = &quot;card&quot;</h3>
                        <p>Preconstructed block, needs only text color and background color.</p>
                        <p>Paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu efficitur dolor. Morbi sed libero euismod felis aliquam cursus. Vestibulum aliquet vulputate leo, non lacinia arcu placerat a. Sed sollicitudin id ante sit amet semper. Aenean tincidunt mollis consectetur. Nullam vehicula scelerisque sapien. Phasellus in mauris imperdiet tellus auctor luctus. </p>
                    </div>
                    <div className="card bg-orange-500">
                        <h3>className = &quot;card&quot;</h3>
                        <p>Preconstructed block, needs only text color and background color.</p>
                        <p>Paragraph: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu efficitur dolor. Morbi sed libero euismod felis aliquam cursus. Vestibulum aliquet vulputate leo, non lacinia arcu placerat a. Sed sollicitudin id ante sit amet semper. Aenean tincidunt mollis consectetur. Nullam vehicula scelerisque sapien. Phasellus in mauris imperdiet tellus auctor luctus. </p>
                    </div>
                </div>
            </div>
            <hr className="border-2 rounded-xl"/>         
            <div id="images" className="my-4 p-4">
                className = &quot;img-container&quot;: styled image class, allows images to be resized and placed
                <Image
                    className="img-container"
                    src={example1}
                    alt="example image 1"
                />
                images resized using their width, used in card-container
                <div className="card-container border-4">
                    <Image
                        className="img-container w-[30%]"
                        src={example2}
                        alt="example image 1"
                    />
                    <Image
                        className="img-container w-[50%]"
                        src={example2}
                        alt="example image 1"
                    />
                </div>
                <em className="text-sm">Note: If different sized images are used, one might not follow the styling (ex: no rounded corners). This can be solved using object-cover in className</em>
            </div>

        </main>
    );
}

export default page;
